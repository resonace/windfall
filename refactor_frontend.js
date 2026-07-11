const fs = require('fs');
const path = require('path');

const replacements = {
  // Paths
  'components/SharedLayout': 'modules/core-ui/MainLayoutModule',
  'context/WalletContext': 'core/providers/Web3StateProvider',
  'utils/stellar': 'core/handlers/stellar',
  'utils/format': 'core/handlers/format',
  '@/components/': '@/modules/core-ui/',
  '@/context/': '@/core/providers/',
  '@/utils/': '@/core/handlers/',

  // Component/Context names
  'SharedLayout': 'MainLayoutModule',
  'WalletContext': 'Web3StateProvider',
  'WalletProvider': 'Web3StateProvider',
  
  // Hook names
  'useWallet': 'useWeb3State',
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.css'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let newContent = content;
        for (const [key, value] of Object.entries(replacements)) {
          // simple string replacement globally (multiple passes for safety)
          newContent = newContent.split(key).join(value);
        }
        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent);
          console.log('Updated', fullPath);
        }
      }
    }
  }
}

processDir(path.join(__dirname, 'frontend', 'src'));
processDir(path.join(__dirname, 'frontend', 'app')); // if applicable
