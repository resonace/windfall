#!/bin/bash
set -e
echo "Building contracts..."
stellar contract build

echo "Setting up deployer..."
# Deployer already exists, we will just use it.
ADMIN=$(stellar keys address windfall-deployer)

echo "Deploying contracts with ADMIN=$ADMIN..."
ENTRY_TOKEN=$(stellar contract deploy --wasm target/wasm32v1-none/release/entry_token.wasm --source windfall-deployer --network testnet)
FEE_VAULT=$(stellar contract deploy --wasm target/wasm32v1-none/release/fee_vault.wasm --source windfall-deployer --network testnet)
PRIZE_POOL_COORDINATOR=$(stellar contract deploy --wasm target/wasm32v1-none/release/prize_pool_coordinator.wasm --source windfall-deployer --network testnet)
XLM=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC

echo "Initializing contracts..."
stellar contract invoke --id $ENTRY_TOKEN --source windfall-deployer --network testnet -- init --coordinator_id $PRIZE_POOL_COORDINATOR
stellar contract invoke --id $FEE_VAULT --source windfall-deployer --network testnet -- init --admin $ADMIN --coordinator_id $PRIZE_POOL_COORDINATOR --token $XLM
stellar contract invoke --id $PRIZE_POOL_COORDINATOR --source windfall-deployer --network testnet -- init --admin $ADMIN --entry_token_contract $ENTRY_TOKEN --fee_vault_contract $FEE_VAULT --token $XLM --entry_token_price 10000000 --tax_basis_points 500

echo "Opening round #1 for 1 hour..."
stellar contract invoke --id $PRIZE_POOL_COORDINATOR --source windfall-deployer --network testnet -- initialize_epoch --duration_secs 3600

echo "New Contract Addresses:"
echo "PRIZE_POOL_COORDINATOR: $PRIZE_POOL_COORDINATOR"
echo "ENTRY_TOKEN: $ENTRY_TOKEN"
echo "FEE_VAULT: $FEE_VAULT"
