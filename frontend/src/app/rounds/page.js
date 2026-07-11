"use client";

import { useWeb3State } from "../../core/providers/Web3StateProvider";
import { fromStroops } from "../../core/handlers/stellar";
import { ExternalLink, Trophy, HelpCircle, ShieldCheck } from "lucide-react";

export default function Epochs() {
  const { roundInfo, currentEpochId } = useWeb3State();

  const mockEpochs = [
    {
      epoch_id: 1,
      active_liquidity: 5000000000n, // 500 XLM
      entry_token_count: 5,
      victor: "GAKF7GXDBJS2MMMVFHE4UNEKXJM3BABM3DQCSTF3JKRKN5WZI4GW4TIV",
      settle_tx: "f7e84e817952f2be2f9b4a3984311831e8eb09e6a7b3b365f9282df743eb55f7",
      status: 2 // settled
    }
  ];

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      <div>
        <h2 className="text-2xl font-black text-white">Epoch History & Audits</h2>
        <p className="text-xs text-text-muted mt-1">
          Complete transparent log of all finished timed rounds. Every settlement draw is verifiable on-chain.
        </p>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-bold text-text-muted tracking-wider">
                <th className="py-4 px-6">Epoch</th>
                <th className="py-4 px-6">Jackactive_liquidity (XLM)</th>
                <th className="py-4 px-6">EntryTokens</th>
                <th className="py-4 px-6">Winner Address</th>
                <th className="py-4 px-6">Draw Hash</th>
                <th className="py-4 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-white/5">
              
              {/* Highlight Active Epoch from Context */}
              {roundInfo.epoch_id > 0 && (
                <tr className="bg-accent-primary/10 font-semibold text-white">
                  <td className="py-4 px-6 font-bold">
                    #{roundInfo.epoch_id}
                  </td>
                  <td className="py-4 px-6 text-accent-primary font-extrabold">
                    {fromStroops(BigInt(roundInfo.active_liquidity))} XLM
                  </td>
                  <td className="py-4 px-6">
                    {roundInfo.entry_token_count} sold
                  </td>
                  <td className="py-4 px-6 font-mono opacity-60">
                    {roundInfo.victor ? `${roundInfo.victor.slice(0, 6)}...${roundInfo.victor.slice(-4)}` : "Pending draw"}
                  </td>
                  <td className="py-4 px-6 font-mono text-accent-primary">
                    --
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-[10px] font-bold text-white bg-accent-secondary px-2 py-0.5 rounded-md">
                      Active
                    </span>
                  </td>
                </tr>
              )}

              {/* Render Historical Epochs */}
              {mockEpochs.map((round) => (
                <tr key={round.epoch_id} className="text-text-muted hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-bold text-white">
                    #{round.epoch_id}
                  </td>
                  <td className="py-4 px-6 font-semibold text-white">
                    {fromStroops(round.active_liquidity)} XLM
                  </td>
                  <td className="py-4 px-6">
                    {round.entry_token_count} entry_tokens
                  </td>
                  <td className="py-4 px-6 font-mono text-white">
                    <a
                      href={`https://stellar.expert/explorer/testnet/account/${round.victor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1 inline-flex hover:text-accent-primary"
                    >
                      {round.victor.slice(0, 6)}...{round.victor.slice(-4)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-4 px-6 font-mono">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${round.settle_tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-accent-primary flex items-center gap-1 inline-flex"
                    >
                      {round.settle_tx.slice(0, 8)}...
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-[10px] font-bold glass-panel px-2 py-0.5 rounded-md text-white">
                      Settled
                    </span>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
