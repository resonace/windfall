#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    PrizePoolCoordinator,
    Balance(Address, u32), // (Owner, EpochId) -> Count
    Holders(u32),          // EpochId -> Vec<Address>
}

#[contract]
pub struct EntryTokenContract;

#[contractimpl]
impl EntryTokenContract {
    pub fn init(env: Env, coordinator_id: Address) {
        if env.storage().instance().has(&DataKey::PrizePoolCoordinator) {
            panic!("already initialized");
        }
        env.storage()
            .instance()
            .set(&DataKey::PrizePoolCoordinator, &coordinator_id);
    }

    pub fn fetch_prize_pool_coordinator(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::PrizePoolCoordinator)
            .unwrap_or_else(|| panic!("not initialized"))
    }

    pub fn mint(env: Env, to: Address, epoch_id: u32) {
        let prize_pool_coordinator = Self::fetch_prize_pool_coordinator(env.clone());
        prize_pool_coordinator.require_auth();

        let holders_key = DataKey::Holders(epoch_id);
        let mut holders: soroban_sdk::Vec<Address> = env
            .storage()
            .persistent()
            .get(&holders_key)
            .unwrap_or_else(|| soroban_sdk::Vec::new(&env));

        holders.push_back(to.clone());
        env.storage().persistent().set(&holders_key, &holders);

        // Update buyer's entry_token count for this round
        let bal_key = DataKey::Balance(to.clone(), epoch_id);
        let user_bal: u32 = env.storage().persistent().get(&bal_key).unwrap_or(0);
        env.storage().persistent().set(&bal_key, &(user_bal + 1));
    }

    pub fn balance(env: Env, owner: Address, epoch_id: u32) -> u32 {
        let bal_key = DataKey::Balance(owner, epoch_id);
        env.storage().persistent().get(&bal_key).unwrap_or(0)
    }

    // Helper function for the prize_pool_coordinator contract to resolve the winning index to owner
    pub fn get_owner(env: Env, epoch_id: u32, index: u32) -> Address {
        let holders_key = DataKey::Holders(epoch_id);
        let holders: soroban_sdk::Vec<Address> = env
            .storage()
            .persistent()
            .get(&holders_key)
            .unwrap_or_else(|| panic!("round not found"));

        holders
            .get(index)
            .unwrap_or_else(|| panic!("index out of bounds"))
    }

    // Helper function for the prize_pool_coordinator contract to query total entry_tokens
    pub fn get_entry_token_count(env: Env, epoch_id: u32) -> u32 {
        let holders_key = DataKey::Holders(epoch_id);
        if env.storage().persistent().has(&holders_key) {
            let holders: soroban_sdk::Vec<Address> =
                env.storage().persistent().get(&holders_key).unwrap();
            holders.len()
        } else {
            0
        }
    }
}
