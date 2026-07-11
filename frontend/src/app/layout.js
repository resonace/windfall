import "./globals.css";
import { Web3StateProvider } from "../core/providers/Web3StateProvider";
import MainLayoutModule from "../modules/core-ui/MainLayoutModule";

export const metadata = {
  title: "Windfall | Stellar Soroban prize pool dApp",
  description: "Buy entry_tokens into a shared prize pool during a timed round. One entry_token is selected via on-chain pseudo-randomness, paying out the jackactive_liquidity to the victor.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-cream text-charcoal">
        <Web3StateProvider>
          <MainLayoutModule>{children}</MainLayoutModule>
        </Web3StateProvider>
      </body>
    </html>
  );
}
