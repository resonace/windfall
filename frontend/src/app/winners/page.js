"use client";

import { useWeb3State } from "../../core/providers/Web3StateProvider";
import { fromStroops } from "../../core/handlers/stellar";
import { Trophy, ExternalLink, Award, ShieldCheck } from "lucide-react";

export default function Winners() {
  const { roundInfo } = useWeb3State();

  const mockWinners = [
    {
      epoch_id: 1,
      victor: "GAKF7GXDBJS2MMMVFHE4UNEKXJM3BABM3DQCSTF3JKRKN5WZI4GW4TIV",
      amount: 4750000000n, // 475 XLM (payout = 500 active_liquidity - 25 fee)
      active_liquidity: 5000000000n,
      tx: "f7e84e817952f2be2f9b4a3984311831e8eb09e6a7b3b365f9282df743eb55f7",
      timestamp: "2026-07-08T06:55:40Z"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-white">Winners Feed</h2>
        <p className="text-xs text-text-muted mt-1">
          Verifiable ledger transactions showing payout distributions to round victors.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Active victor from context if settled */}
        {roundInfo.status === 2 && roundInfo.victor && (
          <div className="glass-panel-heavy border-2 border-accent-secondary/30 rounded-3xl p-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-secondary/10 rounded-full blur-2xl"></div>
            <div className="flex items-start gap-4">
              <div className="bg-accent-secondary text-white p-3 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] uppercase font-bold tracking-widest text-accent-secondary glass-panel border border-accent-secondary/30 px-2 py-0.5 rounded-md mb-2 inline-block">
                  Live Draw Winner
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Epoch #{roundInfo.epoch_id} Winner selected
                </h3>
                <div className="mt-3 flex flex-col gap-1.5 text-xs text-text-muted">
                  <div>
                    Winner Account: <span className="font-mono text-white font-bold select-all break-all">{roundInfo.victor}</span>
                  </div>
                  <div>
                    Prize Payout: <span className="font-extrabold text-accent-secondary">{fromStroops(BigInt(roundInfo.active_liquidity) * 95n / 100n)} XLM</span> (95% jackactive_liquidity)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mockWinners.map((victor, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* EntryToken side indents */}
            <div className="absolute top-1/2 -left-3.5 w-7 h-7 bg-background border-r border-white/10 rounded-full -translate-y-1/2"></div>
            <div className="absolute top-1/2 -right-3.5 w-7 h-7 bg-background border-l border-white/10 rounded-full -translate-y-1/2"></div>
            <div className="flex items-center gap-4">
              <div className="glass-panel text-accent-primary p-3 rounded-2xl">
                <Award className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">
                  Epoch #{victor.epoch_id} Jackactive_liquidity Payout
                </h4>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Winner: <span className="font-mono text-white font-bold">{victor.victor.slice(0, 12)}...{victor.victor.slice(-6)}</span>
                </p>
                <p className="text-[9px] text-text-muted mt-1">
                  Settled at: {new Date(victor.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-text-muted block">Prize Reward</span>
                <span className="text-lg font-black text-accent-primary">{fromStroops(victor.amount)} XLM</span>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${victor.tx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-accent-primary hover:underline inline-flex items-center gap-1 glass-panel hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10"
              >
                Verify Tx
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
