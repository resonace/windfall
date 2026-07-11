"use client";

import Link from "next/link";
import { useWeb3State } from "../core/providers/Web3StateProvider";
import { Clock, Ticket, ArrowRight, HelpCircle, Trophy, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { roundInfo, currentEpochId } = useWeb3State();
  const [timeLeft, setTimeLeft] = useState("");
  const [tickerVal, setTickerVal] = useState(0);

  // Parse active_liquidity value from roundInfo
  const currentPotStr = roundInfo.active_liquidity ? (Number(roundInfo.active_liquidity) / 10_000_000).toFixed(2) : "0.00";
  const currentPot = parseFloat(currentPotStr);

  // Smooth entry_token buying counter ticker effect
  useEffect(() => {
    let start = 0;
    const end = currentPot;
    if (end === 0) {
      setTickerVal(0);
      return;
    }
    const totalDuration = 800; // ms
    const stepTime = 16; // ~60fps
    const steps = totalDuration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setTickerVal(end);
        clearInterval(timer);
      } else {
        setTickerVal(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [currentPot]);

  // Countdown timer logic
  useEffect(() => {
    if (roundInfo.epoch_conclusion === 0 || roundInfo.status !== 1) {
      setTimeLeft("");
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const difference = roundInfo.epoch_conclusion - now;

      if (difference <= 0) {
        setTimeLeft("00:00 - Epoch Ended");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(difference / 60);
        const seconds = difference % 60;
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roundInfo.epoch_conclusion, roundInfo.status]);

  return (
    <div className="flex flex-col gap-12 max-w-4xl mx-auto w-full py-6 animate-fade-in">
      
      {/* Testnet Disclaimer */}
      <div className="glass-panel-heavy border-accent-primary/30 text-accent-primary px-5 py-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
        <ShieldAlert className="w-5.5 h-5.5 mt-0.5 flex-shrink-0 text-accent-primary" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white">Testnet Protocol Disclaimer</h4>
          <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
            This application is a technical submission running entirely on the Stellar Soroban testnet network. No real funds, currency, or capital are at stake. All transactions utilize valueless, testnet-minted mock XLM.
          </p>
        </div>
      </div>

      {/* Centerpiece Hero section */}
      <div className="glass-panel-heavy rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden flex flex-col items-center border border-white/10">
        
        {/* Glow decorative */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-accent-primary/20 blur-3xl rounded-full pointer-events-none"></div>

        <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted glass-panel px-3.5 py-1.5 rounded-full mb-6 relative">
          Epoch #{roundInfo.epoch_id || currentEpochId || "1"} Active Pool
        </span>

        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight max-w-xl leading-tight text-shadow">
          Timed Decentralized Prize Pool Jackactive_liquiditys
        </h2>
        
        <p className="text-sm text-text-muted mt-3 max-w-md leading-relaxed">
          Buy entry_tokens into the shared prize pool. A ledger-derived random draw settles the round, sending the jackactive_liquidity straight to the victor.
        </p>

        {/* EntryToken Stub Pot Counter Centerpiece */}
        <div className="my-10 glass-panel rounded-2xl relative p-6 sm:p-8 flex flex-col items-center min-w-[300px] overflow-hidden">
          {/* EntryToken side indents */}
          <div className="absolute top-1/2 -left-3.5 w-7 h-7 bg-bg-cream rounded-full -translate-y-1/2 shadow-inner"></div>
          <div className="absolute top-1/2 -right-3.5 w-7 h-7 bg-bg-cream rounded-full -translate-y-1/2 shadow-inner"></div>
          
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-text-muted mb-2">
            Current Epoch Jackactive_liquidity
          </span>
          
          {/* Oversized tabular numeric text */}
          <div className="text-5xl sm:text-6xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-primary-hover flex items-baseline gap-1.5 font-tabular select-all filter drop-shadow-lg">
            {tickerVal.toFixed(2)}
            <span className="text-lg font-bold text-white">XLM</span>
          </div>

          {/* Perforated divider dashed line */}
          <div className="w-full border-t-2 border-dashed border-white/20 my-4"></div>
          
          <div className="text-[9px] uppercase tracking-widest text-text-muted font-bold">
            Verifiable Ledger Pool
          </div>
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-2 gap-8 w-full max-w-sm mb-10 border-b border-white/10 pb-8">
          <div className="border-r border-white/10 pr-4">
            <span className="text-[9px] uppercase font-semibold text-text-muted tracking-wider block mb-1">
              EntryTokens Sold
            </span>
            <div className="text-lg font-extrabold text-white">
              {roundInfo.entry_token_count || 0} EntryTokens
            </div>
          </div>
          <div className="pl-4">
            <span className="text-[9px] uppercase font-semibold text-text-muted tracking-wider block mb-1">
              Closes in
            </span>
            <div className="text-lg font-extrabold text-white flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-accent-primary" />
              {timeLeft || "Closed"}
            </div>
          </div>
        </div>

        {/* Enter Epoch CTA */}
        <Link
          href="/play"
          className="glass-button-primary px-8 py-4 rounded-xl flex items-center gap-2 group text-sm font-bold"
        >
          Enter Epoch & Buy EntryTokens
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Latest Winner Banner */}
      {roundInfo.status === 2 && roundInfo.victor && (
        <div className="glass-panel border-accent-secondary/30 px-6 py-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="bg-accent-secondary/20 p-2 rounded-xl text-accent-secondary">
              <Trophy className="w-5.5 h-5.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Latest Winner Selected!</h4>
              <p className="text-[11px] text-text-muted mt-0.5">
                Winner: <span className="font-mono text-white font-bold">{roundInfo.victor.slice(0, 10)}...{roundInfo.victor.slice(-6)}</span>
              </p>
            </div>
          </div>
          <Link
            href="/victors"
            className="text-xs font-bold text-accent-secondary hover:text-white transition-colors flex items-center gap-1"
          >
            Winners Feed
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 3-step works strip */}
      <div className="border-t border-white/10 pt-10">
        <h3 className="text-xs uppercase font-black text-white tracking-widest text-center mb-8 text-shadow">
          The 3-Step Flow
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl relative">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-xs mb-4">
              01
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Buy EntryToken Entries</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Mint a EntryToken Token (mint restricted to the coordinator contract) for 1 XLM. Every entry adds to the round active_liquidity.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-xs mb-4">
              02
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Wait for Countdown</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Each round runs for a fixed timed window. No purchases can be made once the timer expires.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-xs mb-4">
              03
            </div>
            <h4 className="text-sm font-bold text-white mb-1">On-Chain Settlement</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Trigger the random draw. The victor receives 95% of the active_liquidity, and the remaining 5% goes to the fee_vault vault.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
