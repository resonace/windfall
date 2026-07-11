const fs = require('fs');
const path = require('path');

// 1. Fix Web3StateProvider.js context name
const web3Path = path.join(__dirname, 'frontend/src/core/providers/Web3StateProvider.js');
let web3Content = fs.readFileSync(web3Path, 'utf8');
web3Content = web3Content.replace('const Web3StateProvider = createContext(null);', 'const Web3StateContext = createContext(null);');
web3Content = web3Content.replace(/export function useWeb3State\(\) {\n  return useContext\(Web3StateProvider\);\n}/, 'export function useWeb3State() {\n  return useContext(Web3StateContext);\n}');
web3Content = web3Content.replace(/<Web3StateProvider\.Provider/g, '<Web3StateContext.Provider');
web3Content = web3Content.replace(/<\/Web3StateProvider\.Provider/g, '</Web3StateContext.Provider');
web3Content = web3Content.replace(/from "\.\.\/core\/handlers\/stellar"/g, 'from "../handlers/stellar"');
fs.writeFileSync(web3Path, web3Content);

// 2. Fix MainLayoutModule.js import
const layoutPath = path.join(__dirname, 'frontend/src/modules/core-ui/MainLayoutModule.js');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');
layoutContent = layoutContent.replace('from "../core/providers/Web3StateProvider"', 'from "../../core/providers/Web3StateProvider"');
fs.writeFileSync(layoutPath, layoutContent);

// 3. Fix lucide-react EntryToken -> Ticket in all files
function fixLucide(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixLucide(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (['.js', '.jsx'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let newContent = content;
        
        // Only replace inside lucide-react import
        const lucideRegex = /import\s+\{([^}]+)\}\s+from\s+["']lucide-react["']/g;
        newContent = newContent.replace(lucideRegex, (match, p1) => {
          return `import {${p1.replace(/\bEntryToken\b/g, 'Ticket')}} from "lucide-react"`;
        });
        
        // Also fix the tag in JSX: <EntryToken -> <Ticket
        newContent = newContent.replace(/<EntryToken\b/g, '<Ticket');
        
        // Also fix any other broken imports caused by mass replacement
        newContent = newContent.replace(/from "\.\.\/core\/providers\/Web3StateProvider"/g, 'from "../../core/providers/Web3StateProvider"');

        if (content !== newContent) {
          fs.writeFileSync(fullPath, newContent);
          console.log('Fixed Lucide icons & imports in', fullPath);
        }
      }
    }
  }
}

fixLucide(path.join(__dirname, 'frontend/src'));
