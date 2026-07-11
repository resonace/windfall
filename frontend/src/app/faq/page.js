"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      q: "Is this real money?",
      a: "No. Windfall operates entirely on the Stellar Testnet. All transactions use testnet XLM which holds no monetary or real-world value. It is exclusively a technical showcase."
    },
    {
      q: "How is the victor picked?",
      a: "The victor is drawn when a user triggers 'Settle Epoch'. The coordinator contract hashes entropy from the current ledger timestamp, sequence number, round ID, and entry_token count. The resulting hash is mapped to a winning entry_token index and resolved to the owner's address via the EntryToken contract."
    },
    {
      q: "What is the fee?",
      a: "Each settled round pool incurs a fixed 5% (500 bps) fee that is transferred to the FeeVault contract. The remaining 95% is instantly paid out to the victor."
    },
    {
      q: "Which wallets work?",
      a: "Any wallet supporting the Stellar Wallets Kit can be connected. Freighter Wallet is the primary recommended extension. Albedo, Rabet, and xBull are also supported."
    },
    {
      q: "What if a round has no entry_tokens?",
      a: "If the countdown timer expires and zero entry_tokens have been purchased, the round is voided upon settlement, returning the coordinator status to inactive without draws or payouts."
    },
    {
      q: "Can I buy multiple entry_tokens?",
      a: "Yes! You can buy multiple entry_tokens to increase your draw odds. The UI quantity selector allows buying up to 5 entry_tokens in a single sequence transaction to prevent ledger collision sequence errors."
    },
    {
      q: "Is the randomness fair?",
      a: "Yes, the draw maps directly to entry_token indices. However, since the entropy is derived from ledger headers (timestamp, sequence), block validators could theoretically simulate outcomes ahead of submission. This is suitable for demonstration apps, but mainnet releases should utilize a decentralized oracle like Pyth VRF."
    }
  ];

  const [openIdx, setOpenIdx] = useState(null);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-white">Frequently Asked Questions</h2>
        <p className="text-xs text-text-muted mt-1">
          Everything you need to know about the Windfall prize pool protocol.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="glass-panel rounded-2xl overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-extrabold text-white flex items-center gap-3">
                  <HelpCircle className="w-4.5 h-4.5 text-accent-primary flex-shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isOpen && (
                <div className="px-6 pb-5 text-xs text-text-muted leading-relaxed border-t border-white/10 pt-4 bg-white/5">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
