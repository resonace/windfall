"use client";

import { PRIZE_POOL_COORDINATOR_ID, ENTRY_TOKEN_ID, FEE_VAULT_ID, XLM_SAC_ID } from "../../core/handlers/stellar";
import { ExternalLink, Layers, FileCode, Cpu } from "lucide-react";

const GithubIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={props.className}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function About() {
  const contracts = [
    { name: "PrizePoolCoordinator (Coordinator)", address: PRIZE_POOL_COORDINATOR_ID },
    { name: "EntryToken Token", address: ENTRY_TOKEN_ID },
    { name: "FeeVault Pool", address: FEE_VAULT_ID },
    { name: "Native XLM Wrapper", address: XLM_SAC_ID }
  ];

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-white">About Windfall</h2>
        <p className="text-xs text-text-muted mt-1">
          Technical specifications, project details, and repository deployment credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Project Purpose */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-white/10 pb-2">
            Project Purpose
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Windfall is a decentralized smart contract application built for the **Stellar dApp Challenge Submission Program (Level 3 Tier)**. 
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            The target is to demonstrate advanced blockchain development methodologies: multi-contract configurations, cross-contract calls, event logging, clean component architectures, robust wallet handlers, test-driven development, and automated workflows.
          </p>

          <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-white/10 pb-2 mt-4">
            Tech Stack Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-2 glass-panel-heavy border-white/5 p-3 rounded-xl">
              <Cpu className="w-4.5 h-4.5 text-accent-primary" />
              <div>
                <span className="font-bold text-white block">Soroban Contracts</span>
                <span>Rust & SDK v26</span>
              </div>
            </div>
            <div className="flex items-center gap-2 glass-panel-heavy border-white/5 p-3 rounded-xl">
              <Layers className="w-4.5 h-4.5 text-accent-primary" />
              <div>
                <span className="font-bold text-white block">Frontend Client</span>
                <span>Next.js App Router</span>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub / Repo details */}
        <div className="glass-panel rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/10 pb-2">
            Source Code
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            The complete source code including contracts, unit tests, and frontend pages is open source on GitHub.
          </p>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 glass-button-primary py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold"
          >
            <GithubIcon className="w-4.5 h-4.5" />
            GitHub Repository
          </a>
        </div>

      </div>

      {/* Contract Addresses table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4">
          Contract Deployments Registry
        </h3>
        <div className="flex flex-col gap-4">
          {contracts.map((contract, i) => (
            <div key={i} className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-extrabold text-white">{contract.name}</span>
                <span className="font-mono text-[10px] text-text-muted block select-all break-all mt-1">{contract.address}</span>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${contract.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-accent-primary hover:underline inline-flex items-center gap-1.5 flex-shrink-0 glass-panel hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
              >
                Explorer View
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
