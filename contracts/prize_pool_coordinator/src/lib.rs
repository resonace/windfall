#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Bytes, Env, IntoVal, Symbol, Val,
};

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct EpochInfo {
    pub epoch_id: u32,
    pub status: u32, // 0 = inactive/voided, 1 = active, 2 = settled
    pub entry_token_count: u32,
    pub entry_token_price: i128,
    pub active_liquidity: i128,
    pub epoch_conclusion: u64,
    pub victor: Option<Address>,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    EntryTokenContract,
    FeeVaultContract,
    Token,
    EntryTokenPrice,
    FeeBps,
    CurrentEpochId,
    Epoch(u32),
}

#[contract]
pub struct PrizePoolCoordinatorContract;

#[contractimpl]
impl PrizePoolCoordinatorContract {
    pub fn init(
        env: Env,
        admin: Address,
        entry_token_contract: Address,
        fee_vault_contract: Address,
        token: Address,
        entry_token_price: i128,
        tax_basis_points: u32,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::EntryTokenContract, &entry_token_contract);
        env.storage().instance().set(&DataKey::FeeVaultContract, &fee_vault_contract);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::EntryTokenPrice, &entry_token_price);
        env.storage().instance().set(&DataKey::FeeBps, &tax_basis_points);
        env.storage().instance().set(&DataKey::CurrentEpochId, &0u32);
    }

    pub fn fetch_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn initialize_epoch(env: Env, duration_secs: u64) -> u32 {
        let admin = Self::fetch_admin(env.clone());
        admin.require_auth();

        let mut current_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::CurrentEpochId)
            .unwrap_or(0);

        if current_id > 0 {
            let last_round_key = DataKey::Epoch(current_id);
            if env.storage().persistent().has(&last_round_key) {
                let last_round: EpochInfo = env
                    .storage()
                    .persistent()
                    .get(&last_round_key)
                    .unwrap();
                if last_round.status == 1 {
                    panic!("previous round is still active");
                }
            }
        }

        current_id = current_id.saturating_add(1);
        let epoch_conclusion = env.ledger().timestamp().saturating_add(duration_secs);
        let entry_token_price: i128 = env.storage().instance().get(&DataKey::EntryTokenPrice).unwrap_or(0);

        let round_info = EpochInfo {
            epoch_id: current_id,
            status: 1, // active
            entry_token_count: 0,
            entry_token_price,
            active_liquidity: 0,
            epoch_conclusion,
            victor: None,
        };

        env.storage().instance().set(&DataKey::CurrentEpochId, &current_id);
        env.storage().persistent().set(&DataKey::Epoch(current_id), &round_info);

        // Publish event
        let event_data: soroban_sdk::Vec<Val> = soroban_sdk::vec![
            &env,
            epoch_conclusion.into_val(&env)
        ];
        env.events().publish((Symbol::new(&env, "round_opened"), current_id), event_data);

        current_id
    }

    pub fn buy_entry_token(env: Env, buyer: Address, epoch_id: u32) {
        buyer.require_auth();

        let round_key = DataKey::Epoch(epoch_id);
        let mut round: EpochInfo = env
            .storage()
            .persistent()
            .get(&round_key)
            .unwrap_or_else(|| panic!("round not found"));

        if round.status != 1 {
            panic!("round is not active");
        }

        let current_time = env.ledger().timestamp();
        if current_time >= round.epoch_conclusion {
            panic!("round already closed");
        }

        let token = env.storage().instance().get(&DataKey::Token).unwrap_or_else(|| panic!("no token"));

        // Pull funds from buyer to this contract
        let args = soroban_sdk::vec![
            &env,
            env.current_contract_address().into_val(&env), // spender
            buyer.into_val(&env), // from
            env.current_contract_address().into_val(&env), // to
            round.entry_token_price.into_val(&env) // amount
        ];
        let _: () = env.invoke_contract(
            &token,
            &Symbol::new(&env, "transfer_from"),
            args,
        );

        let entry_token_contract = env.storage().instance().get(&DataKey::EntryTokenContract).unwrap_or_else(|| panic!("no entry_token contract"));

        // Mint one entry_token token to buyer
        let mint_args = soroban_sdk::vec![
            &env,
            buyer.clone().into_val(&env),
            epoch_id.into_val(&env)
        ];
        let _: () = env.invoke_contract(
            &entry_token_contract,
            &Symbol::new(&env, "mint"),
            mint_args,
        );

        // Update round stats
        round.entry_token_count = round.entry_token_count.saturating_add(1);
        round.active_liquidity = round.entry_token_price.saturating_mul(round.entry_token_count as i128);
        env.storage().persistent().set(&round_key, &round);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![&env, buyer.into_val(&env)];
        env.events().publish((Symbol::new(&env, "entry_token_bought"), epoch_id), event_data);
    }

    pub fn conclude_epoch(env: Env, epoch_id: u32) -> Address {
        let round_key = DataKey::Epoch(epoch_id);
        let mut round: EpochInfo = env
            .storage()
            .persistent()
            .get(&round_key)
            .unwrap_or_else(|| panic!("round not found"));

        if round.status != 1 {
            panic!("round is not active");
        }

        let current_time = env.ledger().timestamp();
        if current_time < round.epoch_conclusion {
            panic!("round timer has not expired");
        }

        let entry_token_contract = env.storage().instance().get(&DataKey::EntryTokenContract).unwrap_or_else(|| panic!("no entry_token contract"));

        if round.entry_token_count == 0 {
            // Void the round
            round.status = 0; // inactive/voided
            env.storage().persistent().set(&round_key, &round);

            // Publish event
            env.events().publish((Symbol::new(&env, "round_voided"), epoch_id), ());

            return env.current_contract_address();
        }

        // Draw victor via pseudo-randomness
        let mut data = Bytes::new(&env);
        data.extend_from_array(&env.ledger().timestamp().to_be_bytes());
        data.extend_from_array(&(env.ledger().sequence() as u64).to_be_bytes());
        data.extend_from_array(&(epoch_id as u64).to_be_bytes());
        data.extend_from_array(&(round.entry_token_count as u64).to_be_bytes());

        let hash = env.crypto().sha256(&data);
        let hash_arr = hash.to_array();
        let mut first_8 = [0u8; 8];
        first_8.copy_from_slice(&hash_arr[0..8]);
        let seed_as_u64 = u64::from_be_bytes(first_8);
        let winning_entry_token_index = (seed_as_u64 % (round.entry_token_count as u64)) as u32;

        // Resolve winning index to Address
        let victor: Address = env.invoke_contract(
            &entry_token_contract,
            &Symbol::new(&env, "get_owner"),
            soroban_sdk::vec![&env, epoch_id.into_val(&env), winning_entry_token_index.into_val(&env)],
        );

        let tax_basis_points: u32 = env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0);
        let active_liquidity = round.active_liquidity;
        let fee = (active_liquidity * (tax_basis_points as i128)) / 10000;
        let payout = active_liquidity - fee;

        let token = env.storage().instance().get(&DataKey::Token).unwrap_or_else(|| panic!("no token"));

        // 1. Transfer payout to victor
        if payout > 0 {
            let args_victor = soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                victor.clone().into_val(&env),
                payout.into_val(&env)
            ];
            let _: () = env.invoke_contract(
                &token,
                &Symbol::new(&env, "transfer"),
                args_victor,
            );
        }

        let fee_vault: Address = env.storage().instance().get(&DataKey::FeeVaultContract).unwrap_or_else(|| panic!("no fee_vault contract"));

        // 2. Transfer fee to fee_vault and call deposit_fee
        if fee > 0 {
            let args_fee_vault = soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                fee_vault.clone().into_val(&env),
                fee.into_val(&env)
            ];
            let _: () = env.invoke_contract(
                &token,
                &Symbol::new(&env, "transfer"),
                args_fee_vault,
            );

            let deposit_args = soroban_sdk::vec![
                &env,
                epoch_id.into_val(&env),
                fee.into_val(&env)
            ];
            let _: () = env.invoke_contract(
                &fee_vault,
                &Symbol::new(&env, "deposit_fee"),
                deposit_args,
            );
        }

        // Finalize round status
        round.status = 2; // settled
        round.victor = Some(victor.clone());
        env.storage().persistent().set(&round_key, &round);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> = soroban_sdk::vec![&env, victor.clone().into_val(&env)];
        env.events().publish((Symbol::new(&env, "round_settled"), epoch_id), event_data);

        victor
    }

    pub fn get_round(env: Env, epoch_id: u32) -> EpochInfo {
        let round_key = DataKey::Epoch(epoch_id);
        env.storage()
            .persistent()
            .get(&round_key)
            .unwrap_or_else(|| panic!("round not found"))
    }

    pub fn get_entry_tokens(env: Env, epoch_id: u32, owner: Address) -> u32 {
        let entry_token_contract = env.storage().instance().get(&DataKey::EntryTokenContract).unwrap_or_else(|| panic!("no entry_token contract"));
        let args = soroban_sdk::vec![
            &env,
            owner.into_val(&env),
            epoch_id.into_val(&env)
        ];
        let bal: u32 = env.invoke_contract(
            &entry_token_contract,
            &Symbol::new(&env, "balance"),
            args,
        );
        bal
    }

    pub fn get_current_epoch_id(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::CurrentEpochId)
            .unwrap_or(0)
    }
}

mod test;
