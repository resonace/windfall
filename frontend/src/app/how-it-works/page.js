"use client";

import { Info, ShieldAlert, Award, FileCode, CheckCircle2, Layers } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-white">System Mechanics & Architecture</h2>
        <p className="text-xs text-text-muted mt-1">
          Detailed explanation of contract logic, random drawing constraints, and inter-contract execution flows.
        </p>
      </div>

      {/* Mechanics Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-accent-secondary" />
            Core Mechanics
          </h3>
          <ul className="text-xs text-text-muted list-disc pl-4 flex flex-col gap-2">
            <li>
              <strong>Timed Epochs:</strong> Active rounds are opened with a duration parameter. EntryTokens can only be bought while the round timer is ticking down.
            </li>
            <li>
              <strong>EntryToken Mints:</strong> Buying a entry_token pulls 1 XLM and mints a unique EntryToken Token to track round ownership.
            </li>
            <li>
              <strong>Fees:</strong> When settled, 5% of the round active_liquidity is transferred to the fee_vault, and 95% goes to the victor.
            </li>
          </ul>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col gap-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent-primary" />
            Pseudo-Randomness Draw
          </h3>
          <p className="text-xs text-text-muted leading-relaxed">
            The winning index is resolved using ledger-derived parameters:
          </p>
          <pre className="glass-panel-heavy border-white/5 p-3.5 rounded-xl text-[10px] font-mono text-white leading-tight">
{`let mut data = Bytes::new(&env);
data.extend_from_array(&timestamp);
data.extend_from_array(&sequence);
data.extend_from_array(&epoch_id);
data.extend_from_array(&entry_token_count);

let hash = env.crypto().sha256(&data);
let seed = first_8_bytes_as_u64(hash);
let victor_idx = seed % entry_token_count;`}
          </pre>
          <p className="text-[10px] text-text-muted leading-relaxed italic">
            <strong>Limitation:</strong> In public blockchains, validators or miners could theoretically simulate the transaction before committing it, allowing manipulation if they hold enough hashing power. It is ideal for testnet/demonstrations but should be replaced by a secure decentralized oracle (e.g. Pyth/VRF) on mainnet.
          </p>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent-primary" />
          3-Contract Inter-Contract Call Paths
        </h3>

        {/* ASCII / Graphical Diagram */}
        <div className="glass-panel-heavy p-6 rounded-2xl flex flex-col gap-8 text-xs font-mono text-white leading-relaxed">
          <div>
            <h4 className="text-[10px] uppercase font-bold text-text-muted mb-3">
              Flow 1: buy_entry_token() execution path
            </h4>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="glass-panel p-3 rounded-lg w-full sm:w-auto text-center font-bold">
                User
              </div>
              <div className="text-center text-text-muted">&rarr; [buy_entry_token] &rarr;</div>
              <div className="glass-panel p-3 rounded-lg w-full sm:w-auto text-center font-bold">
                PrizePoolCoordinator Contract
              </div>
              <div className="text-center text-text-muted">&rarr; [mint] &rarr;</div>
              <div className="glass-panel p-3 rounded-lg w-full sm:w-auto text-center font-bold">
                EntryToken Token Contract
              </div>
            </div>
            <p className="text-[10px] text-text-muted mt-2">
              Coordinator contract verifies logic, pulls XLM via <code>transfer_from</code>, and calls <code>mint</code> on the EntryToken contract.
            </p>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h4 className="text-[10px] uppercase font-bold text-text-muted mb-3">
              Flow 2: conclude_epoch() execution path
            </h4>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="glass-panel p-3 rounded-lg w-full sm:w-auto text-center font-bold">
                  PrizePoolCoordinator Contract
                </div>
                <div className="text-center text-text-muted">&rarr; [draw & transfers] &rarr;</div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <div className="glass-panel p-2.5 rounded-lg text-center font-bold">
                    Winner (95% XLM Payout)
                  </div>
                  <div className="glass-panel p-2.5 rounded-lg text-center font-bold">
                    FeeVault (5% XLM Fee Vault)
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-text-muted mt-2">
              Coordinator hashes entropy, maps index to token owner via EntryToken contract&apos;s <code>get_owner</code>, and sends transfers to both victor and fee_vault.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
