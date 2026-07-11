#![allow(deprecated)]
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, IntoVal, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    PrizePoolCoordinator,
    Token,
    TotalFees,
}

#[contract]
pub struct FeeVaultContract;

#[contractimpl]
impl FeeVaultContract {
    pub fn init(env: Env, admin: Address, coordinator_id: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::PrizePoolCoordinator, &coordinator_id);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::TotalFees, &0i128);
    }

    pub fn fetch_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn fetch_prize_pool_coordinator(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::PrizePoolCoordinator)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn fetch_token(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Token)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn deposit_fee(env: Env, epoch_id: u32, amount: i128) {
        let prize_pool_coordinator = Self::fetch_prize_pool_coordinator(env.clone());
        prize_pool_coordinator.require_auth();

        if amount <= 0 {
            panic!("invalid fee amount");
        }

        // Increment total fees
        let mut total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalFees)
            .unwrap_or(0);
        total = total.saturating_add(amount);
        env.storage().instance().set(&DataKey::TotalFees, &total);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> =
            soroban_sdk::vec![&env, amount.into_val(&env)];
        env.events()
            .publish((Symbol::new(&env, "fee_deposited"), epoch_id), event_data);
    }

    pub fn withdraw(env: Env, to: Address, amount: i128) {
        let admin = Self::fetch_admin(env.clone());
        admin.require_auth();

        let mut total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalFees)
            .unwrap_or(0);
        if amount <= 0 || amount > total {
            panic!("insufficient fees or invalid amount");
        }

        total = total.saturating_sub(amount);
        env.storage().instance().set(&DataKey::TotalFees, &total);

        let token = Self::fetch_token(env.clone());

        // Transfer funds from FeeVault to 'to'
        // Signature: transfer(from, to, amount)
        let args = soroban_sdk::vec![
            &env,
            env.current_contract_address().into_val(&env),
            to.into_val(&env),
            amount.into_val(&env)
        ];
        let _: () = env.invoke_contract(&token, &Symbol::new(&env, "transfer"), args);

        // Publish event
        let event_data: soroban_sdk::Vec<soroban_sdk::Val> =
            soroban_sdk::vec![&env, to.into_val(&env), amount.into_val(&env)];
        env.events()
            .publish((Symbol::new(&env, "fee_withdrawn"),), event_data);
    }

    pub fn total_fees(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::TotalFees)
            .unwrap_or(0)
    }
}
