const fs = require('fs');
const path = require('path');

const replacements = {
  // Directory & Package names
  'prize_pool_coordinator': 'prize_pool_coordinator',
  'PrizePoolCoordinator': 'PrizePoolCoordinator',
  'PRIZE_POOL_COORDINATOR': 'PRIZE_POOL_COORDINATOR',
  
  'entry_token': 'entry_token',
  'EntryToken': 'EntryToken',
  'ENTRY_TOKEN': 'ENTRY_TOKEN',
  
  'fee_vault': 'fee_vault',
  'FeeVault': 'FeeVault',
  'FEE_VAULT': 'FEE_VAULT',

  // Methods
  'initialize_epoch': 'initialize_epoch',
  'buy_entry_token': 'provision_entry',
  'conclude_epoch': 'conclude_epoch',

  // State keys and properties
  'epoch_id': 'epoch_id',
  'epoch_conclusion': 'epoch_conclusion',
  'entry_token_count': 'minted_entries',
  'entry_token_price': 'entry_cost',
  'tax_basis_points': 'tax_basis_points',
  'active_liquidity': 'active_liquidity',
  'victor': 'victor',
  'Epoch': 'Epoch',
  'EPOCH': 'EPOCH',
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'target' || file === '.next') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (['.rs', '.toml', '.js', '.json', '.md', '.sh', '.mjs', '.css'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let newContent = content;
        for (const [key, value] of Object.entries(replacements)) {
          // Use regex with word boundaries for safe replacement, except for package names in Cargo.toml
          // Actually, since these are specific words, global replace is fine.
          const regex = new RegExp(key, 'g');
          newContent = newContent.replace(regex, value);
        }
        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent);
          console.log('Updated', fullPath);
        }
      }
    }
  }
}

processDir(path.join(__dirname, 'contracts'));
processDir(path.join(__dirname, 'frontend'));
processDir(__dirname); // will hit root files like Cargo.toml, deploy.sh
