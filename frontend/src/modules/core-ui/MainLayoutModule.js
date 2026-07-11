"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3State } from "../../core/providers/Web3StateProvider";
import {
  Wallet,
  Sparkles,
  ExternalLink,
  Info,
  Layers,
  HelpCircle,
  Mail,
  History,
  TrendingUp,
  Award
} from "lucide-react";

export default function MainLayoutModule({ children }) {
  const pathname = usePathname();
  const { pubKey, balance, connectWallet, disconnectWallet } = useWeb3State();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Play", href: "/play" },
    { name: "History", href: "/rounds" },
    { name: "Winners", href: "/victors" },
    { name: "Mechanics", href: "/how-it-works" },
    { name: "About", href: "/about" },
    { name: "FAQ", href: "/faq" },
    { name: "Contact", href: "/contact" }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Banner */}
      <div className="bg-black/40 backdrop-blur-md text-white py-2 px-6 text-xs font-medium tracking-wide flex justify-between items-center select-none border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>
          <span>Soroban Testnet Mode</span>
        </div>
        <div className="opacity-70 text-[10px] sm:text-xs">
          Windfall Aurora Protocol — Decentralized Web3 PrizePoolCoordinator
        </div>
      </div>

      {/* Header */}
      <header className="glass-nav sticky top-0 z-40">
        <div className="max-w-6xl w-full mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/" className="flex items-center gap-3">
              <div className="glass-panel text-white p-2.5 rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white leading-tight">
                  Aurora By Windfall
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">
                  Decentralized Lotteries
                </p>
              </div>
            </Link>

            {/* Mobile Wallet Trigger */}
            <div className="md:hidden">
              {pubKey ? (
                <button
                  onClick={disconnectWallet}
                  className="glass-button text-[10px] px-3 py-2 rounded-xl"
                >
                  {pubKey.slice(0, 4)}...{pubKey.slice(-3)}
                </button>
              ) : (
                <button
                  onClick={connectWallet}
                  className="glass-button text-[10px] px-3 py-2 rounded-xl"
                >
                  Connect
                </button>
              )}
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center flex-wrap gap-1 glass-panel p-1 rounded-xl">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-white/20 text-white shadow-sm"
                      : "text-text-muted hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Wallet Connect */}
          <div className="hidden md:flex items-center gap-3">
            {pubKey ? (
              <div className="flex items-center gap-3 glass-panel px-4 py-2 rounded-xl">
                <div className="text-right">
                  <div className="text-xs font-bold text-white">
                    {balance ? parseFloat(balance).toFixed(2) : "0.00"} XLM
                  </div>
                  <div className="text-[9px] text-text-muted font-mono">
                    {pubKey.slice(0, 6)}...{pubKey.slice(-4)}
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="glass-button text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="glass-button-primary text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-sm"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="glass-nav py-8 text-xs text-text-muted mt-auto">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-white mb-1">
              Windfall Aurora Protocol
            </div>
            <div>
              &copy; 2026. Built using Soroban Rust SDK and Next.js static asset compiler.
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 font-semibold text-white">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline inline-flex items-center gap-1"
            >
              GitHub Project
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="hidden sm:inline opacity-30">|</span>
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Stellar Expert Testnet
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
