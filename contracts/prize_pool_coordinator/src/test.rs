#![cfg(test)]

use super::*;
use entry_token::EntryTokenContract;
use fee_vault::FeeVaultContract;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

fn setup_test(
    env: &Env,
) -> (
    Address,
    Address,
    Address,
    Address,
    Address,
    PrizePoolCoordinatorContractClient<'_>,
    entry_token::EntryTokenContractClient<'_>,
    fee_vault::FeeVaultContractClient<'_>,
) {
    env.mock_all_auths();
    env.ledger().set_timestamp(1000);

    let admin = Address::generate(env);
    let buyer1 = Address::generate(env);
    let buyer2 = Address::generate(env);
    let fee_vault_admin = Address::generate(env);

    // Register XLM mock token using register_stellar_asset_contract_v2
    let token_admin = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(token_admin);
    let xlm_token_addr = sac.address();
    let sac_client = StellarAssetClient::new(env, &xlm_token_addr);

    // Mint XLM mock tokens to buyers
    sac_client.mint(&buyer1, &10000);
    sac_client.mint(&buyer2, &10000);

    // Deploy EntryTokenContract
    let token_id = env.register(EntryTokenContract, ());
    let token_client = entry_token::EntryTokenContractClient::new(env, &token_id);

    // Deploy FeeVaultContract
    let fee_vault_id = env.register(FeeVaultContract, ());
    let fee_vault_client = fee_vault::FeeVaultContractClient::new(env, &fee_vault_id);

    // Deploy PrizePoolCoordinatorContract
    let prize_pool_coordinator_id = env.register(PrizePoolCoordinatorContract, ());
    let prize_pool_coordinator_client =
        PrizePoolCoordinatorContractClient::new(env, &prize_pool_coordinator_id);

    // Initialize contracts
    prize_pool_coordinator_client.init(
        &admin,
        &token_id,
        &fee_vault_id,
        &xlm_token_addr,
        &100, // entry_token price: 100 XLM
        &500, // fee bps: 5% (500 bps)
    );

    token_client.init(&prize_pool_coordinator_id);
    fee_vault_client.init(
        &fee_vault_admin,
        &prize_pool_coordinator_id,
        &xlm_token_addr,
    );

    (
        admin,
        buyer1,
        buyer2,
        fee_vault_admin,
        xlm_token_addr,
        prize_pool_coordinator_client,
        token_client,
        fee_vault_client,
    )
}

#[test]
fn test_prize_pool_coordinator_initialization() {
    let env = Env::default();
    let (_, _, _, _, _, prize_pool_coordinator_client, _, _) = setup_test(&env);

    let epoch_id = prize_pool_coordinator_client.get_current_epoch_id();
    assert_eq!(epoch_id, 0);
}

#[test]
fn test_initialize_epoch_success() {
    let env = Env::default();
    let (_admin, _, _, _, _, prize_pool_coordinator_client, _, _) = setup_test(&env);

    let epoch_id = prize_pool_coordinator_client.initialize_epoch(&3600);
    assert_eq!(epoch_id, 1);

    let info = prize_pool_coordinator_client.get_round(&epoch_id);
    assert_eq!(info.status, 1); // active
    assert_eq!(info.entry_token_count, 0);
    assert_eq!(info.active_liquidity, 0);
    assert_eq!(info.epoch_conclusion, 4600);
    assert_eq!(info.victor, None);
}

#[test]
#[should_panic(expected = "previous round is still active")]
fn test_initialize_epoch_fails_if_active() {
    let env = Env::default();
    let (_admin, _, _, _, _, prize_pool_coordinator_client, _, _) = setup_test(&env);

    prize_pool_coordinator_client.initialize_epoch(&3600);
    prize_pool_coordinator_client.initialize_epoch(&3600);
}

#[test]
fn test_buy_entry_token_success() {
    let env = Env::default();
    let (_, buyer1, _, _, xlm_token, prize_pool_coordinator_client, token_client, _) =
        setup_test(&env);

    let epoch_id = prize_pool_coordinator_client.initialize_epoch(&3600);

    // Approve prize_pool_coordinator contract to spend buyer1's XLM
    let xlm_client = TokenClient::new(&env, &xlm_token);
    xlm_client.approve(
        &buyer1,
        &prize_pool_coordinator_client.address,
        &100,
        &10000,
    );

    prize_pool_coordinator_client.buy_entry_token(&buyer1, &epoch_id);

    // Check balances
    assert_eq!(xlm_client.balance(&buyer1), 9900);
    assert_eq!(
        xlm_client.balance(&prize_pool_coordinator_client.address),
        100
    );

    // Check entry_token count
    assert_eq!(token_client.balance(&buyer1, &epoch_id), 1);
    assert_eq!(
        prize_pool_coordinator_client.get_entry_tokens(&epoch_id, &buyer1),
        1
    );

    let info = prize_pool_coordinator_client.get_round(&epoch_id);
    assert_eq!(info.entry_token_count, 1);
    assert_eq!(info.active_liquidity, 100);
}

#[test]
#[should_panic(expected = "round already closed")]
fn test_buy_entry_token_fails_if_closed() {
    let env = Env::default();
    let (_, buyer1, _, _, xlm_token, prize_pool_coordinator_client, _, _) = setup_test(&env);

    let epoch_id = prize_pool_coordinator_client.initialize_epoch(&3600);

    let xlm_client = TokenClient::new(&env, &xlm_token);
    xlm_client.approve(
        &buyer1,
        &prize_pool_coordinator_client.address,
        &100,
        &10000,
    );

    // Travel in time to end of round
    env.ledger().set_timestamp(4700);

    prize_pool_coordinator_client.buy_entry_token(&buyer1, &epoch_id);
}

#[test]
fn test_conclude_epoch_success() {
    let env = Env::default();
    let (
        _admin,
        buyer1,
        buyer2,
        _fee_vault_admin,
        xlm_token,
        prize_pool_coordinator_client,
        _token_client,
        fee_vault_client,
    ) = setup_test(&env);

    let epoch_id = prize_pool_coordinator_client.initialize_epoch(&3600);

    let xlm_client = TokenClient::new(&env, &xlm_token);
    xlm_client.approve(
        &buyer1,
        &prize_pool_coordinator_client.address,
        &300,
        &10000,
    );
    xlm_client.approve(
        &buyer2,
        &prize_pool_coordinator_client.address,
        &200,
        &10000,
    );

    // Buyer1 buys 3 entry_tokens, Buyer2 buys 2 entry_tokens
    prize_pool_coordinator_client.buy_entry_token(&buyer1, &epoch_id);
    prize_pool_coordinator_client.buy_entry_token(&buyer1, &epoch_id);
    prize_pool_coordinator_client.buy_entry_token(&buyer1, &epoch_id);
    prize_pool_coordinator_client.buy_entry_token(&buyer2, &epoch_id);
    prize_pool_coordinator_client.buy_entry_token(&buyer2, &epoch_id);

    assert_eq!(
        xlm_client.balance(&prize_pool_coordinator_client.address),
        500
    );

    // Advance block time
    env.ledger().set_timestamp(4700);

    // Settle round
    let victor = prize_pool_coordinator_client.conclude_epoch(&epoch_id);
    assert!(victor == buyer1 || victor == buyer2);

    // Total fee is 5% of 500 = 25 XLM. Winner payout is 475 XLM.
    assert_eq!(
        xlm_client.balance(&prize_pool_coordinator_client.address),
        0
    );
    assert_eq!(xlm_client.balance(&fee_vault_client.address), 25);
    assert_eq!(fee_vault_client.total_fees(), 25);

    if victor == buyer1 {
        assert_eq!(xlm_client.balance(&buyer1), 9700 + 475);
    } else {
        assert_eq!(xlm_client.balance(&buyer2), 9800 + 475);
    }

    let info = prize_pool_coordinator_client.get_round(&epoch_id);
    assert_eq!(info.status, 2); // settled
    assert_eq!(info.victor, Some(victor));
}

#[test]
fn test_conclude_epoch_voided_if_no_entry_tokens() {
    let env = Env::default();
    let (_, _, _, _, _, prize_pool_coordinator_client, _, _) = setup_test(&env);

    let epoch_id = prize_pool_coordinator_client.initialize_epoch(&3600);

    env.ledger().set_timestamp(4700);

    let victor = prize_pool_coordinator_client.conclude_epoch(&epoch_id);
    assert_eq!(victor, prize_pool_coordinator_client.address); // returns contract address to represent void/no victor

    let info = prize_pool_coordinator_client.get_round(&epoch_id);
    assert_eq!(info.status, 0); // voided
    assert_eq!(info.victor, None);
}

#[test]
#[should_panic]
fn test_fee_vault_unauthorized_deposit() {
    let env = Env::default();
    let fee_vault_id = env.register(FeeVaultContract, ());
    let fee_vault_client = fee_vault::FeeVaultContractClient::new(&env, &fee_vault_id);
    let admin = Address::generate(&env);
    let prize_pool_coordinator = Address::generate(&env);
    let token = Address::generate(&env);
    fee_vault_client.init(&admin, &prize_pool_coordinator, &token);

    fee_vault_client.deposit_fee(&1, &100);
}

#[test]
#[should_panic]
fn test_entry_token_unauthorized_mint() {
    let env = Env::default();
    let token_id = env.register(EntryTokenContract, ());
    let token_client = entry_token::EntryTokenContractClient::new(&env, &token_id);
    let prize_pool_coordinator = Address::generate(&env);
    token_client.init(&prize_pool_coordinator);

    let buyer1 = Address::generate(&env);
    token_client.mint(&buyer1, &1);
}

#[test]
#[should_panic(expected = "round timer has not expired")]
fn test_conclude_epoch_fails_before_epoch_conclusion() {
    let env = Env::default();
    let (_, buyer1, _, _, xlm_token, prize_pool_coordinator_client, _, _) = setup_test(&env);

    let epoch_id = prize_pool_coordinator_client.initialize_epoch(&3600);

    let xlm_client = TokenClient::new(&env, &xlm_token);
    xlm_client.approve(
        &buyer1,
        &prize_pool_coordinator_client.address,
        &100,
        &10000,
    );
    prize_pool_coordinator_client.buy_entry_token(&buyer1, &epoch_id);

    // Settle immediately (before epoch_conclusion) - should panic
    prize_pool_coordinator_client.conclude_epoch(&epoch_id);
}

#[test]
#[should_panic(expected = "round is not active")]
fn test_conclude_epoch_cannot_be_called_twice() {
    let env = Env::default();
    let (_, buyer1, _, _, xlm_token, prize_pool_coordinator_client, _, _) = setup_test(&env);

    let epoch_id = prize_pool_coordinator_client.initialize_epoch(&3600);

    let xlm_client = TokenClient::new(&env, &xlm_token);
    xlm_client.approve(
        &buyer1,
        &prize_pool_coordinator_client.address,
        &100,
        &10000,
    );
    prize_pool_coordinator_client.buy_entry_token(&buyer1, &epoch_id);

    // Advance time
    env.ledger().set_timestamp(4700);

    // Settle first time - succeeds
    prize_pool_coordinator_client.conclude_epoch(&epoch_id);

    // Settle second time - fails/panics
    prize_pool_coordinator_client.conclude_epoch(&epoch_id);
}

#[test]
fn test_victor_index_always_within_bounds() {
    let env = Env::default();
    let (_, buyer1, buyer2, _, xlm_token, prize_pool_coordinator_client, _, _) = setup_test(&env);

    let xlm_client = TokenClient::new(&env, &xlm_token);
    xlm_client.approve(
        &buyer1,
        &prize_pool_coordinator_client.address,
        &10000,
        &10000,
    );
    xlm_client.approve(
        &buyer2,
        &prize_pool_coordinator_client.address,
        &10000,
        &10000,
    );

    // Test across 5 different rounds with varying entry_token counts
    for i in 1..=5 {
        let epoch_id = prize_pool_coordinator_client.initialize_epoch(&3600);

        let entry_tokens_count = i * 2; // 2, 4, 6, 8, 10
        for _ in 0..entry_tokens_count / 2 {
            prize_pool_coordinator_client.buy_entry_token(&buyer1, &epoch_id);
            prize_pool_coordinator_client.buy_entry_token(&buyer2, &epoch_id);
        }

        // Vary seed triggers (timestamp, sequence)
        env.ledger().set_timestamp(1000 + i * 5000);
        env.ledger().set_sequence_number((i * 1000) as u32);

        let victor = prize_pool_coordinator_client.conclude_epoch(&epoch_id);
        let info = prize_pool_coordinator_client.get_round(&epoch_id);

        assert!(victor == buyer1 || victor == buyer2);
        assert_eq!(info.status, 2); // settled
    }
}
