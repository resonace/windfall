"use client";

import { useState, useEffect } from "react";
import { useWeb3State } from "../../core/providers/Web3StateProvider";
import { buildBuyEntryTokenTx, buildApproveTx, buildSettleEpochTx, buildOpenEpochTx, fromStroops, toStroops } from "../../core/handlers/stellar";
import { Ticket, Wallet, Clock, CheckCircle2, AlertTriangle, Coins, ShieldAlert, ArrowRight, ExternalLink, Settings } from "lucide-react";

export default function Play() {
  const {
    pubKey,
    balance,
    allowance,
    userEntryTokens,
    roundInfo,
    adminAddress,
    loading,
    errorMsg,
    successMsg,
    setErrorMsg,
    setSuccessMsg,
    connectWallet,
    executeTransaction,
    refreshData
  } = useWeb3State();

  const [entry_tokenQty, setEntryTokenQty] = useState(1);
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [openDuration, setOpenDuration] = useState(60);

  // Countdown timer logic
  useEffect(() => {
    if (roundInfo.epoch_conclusion === 0 || roundInfo.status !== 1) {
      setTimeLeft("");
      setIsExpired(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const difference = roundInfo.epoch_conclusion - now;

      if (difference <= 0) {
        setTimeLeft("00:00 - Ended");
        setIsExpired(true);
        clearInterval(interval);
      } else {
        const minutes = Math.floor(difference / 60);
        const seconds = difference % 60;
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
        setIsExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roundInfo.epoch_conclusion, roundInfo.status]);

  const pricePerEntryToken = roundInfo.entry_token_price ? BigInt(roundInfo.entry_token_price) : 0n;
  const totalCostStroops = pricePerEntryToken * BigInt(entry_tokenQty);

  // Buy EntryToken action
  const handleBuyEntryTokens = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!pubKey) {
      setErrorMsg("Please connect your wallet first!");
      return;
    }

    if (Math.floor(Date.now() / 1000) >= roundInfo.epoch_conclusion) {
      setErrorMsg("The round timer has expired — no more entry_tokens can be purchased. Settle the round to draw the victor.");
      return;
    }

    const userBalanceStroops = toStroops(parseFloat(balance));
    if (userBalanceStroops < totalCostStroops) {
      setErrorMsg(`Insufficient XLM balance! You need at least ${fromStroops(totalCostStroops)} XLM, but you only have ${balance} XLM.`);
      return;
    }

    // Determine if allowance is sufficient
    const currentAllowance = BigInt(allowance);
    if (currentAllowance < totalCostStroops) {
      // Need to approve first
      await executeTransaction(
        () => buildApproveTx(pubKey, totalCostStroops),
        async () => {
          // Wait 2 seconds for ledger state propagation before buying
          await new Promise((r) => setTimeout(r, 2000));
          await buyStep();
        },
        "Approve XLM Spend"
      );
    } else {
      await buyStep();
    }
  };

  const buyStep = async () => {
    // Loop to buy the requested number of entry_tokens
    for (let i = 0; i < entry_tokenQty; i++) {
      // The timer may run out mid-batch — re-check before each purchase
      if (Math.floor(Date.now() / 1000) >= roundInfo.epoch_conclusion) {
        setErrorMsg(`Epoch closed after ${i} of ${entry_tokenQty} entry_tokens — no more entries allowed. Settle the round to draw the victor.`);
        return;
      }
      const ok = await executeTransaction(
        () => buildBuyEntryTokenTx(pubKey, roundInfo.epoch_id),
        () => {
          setSuccessMsg(`Successfully bought entry_token #${i + 1} of ${entry_tokenQty}!`);
        },
        `Buy EntryToken ${i + 1}/${entry_tokenQty}`
      );
      // Stop the batch on the first failure — the error is already displayed
      if (!ok) return;
      if (entry_tokenQty > 1 && i < entry_tokenQty - 1) {
        // Wait between multi-mints to prevent transaction submission sequence overlap
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
  };

  const handleSettle = async () => {
    await executeTransaction(
      () => buildSettleEpochTx(pubKey, roundInfo.epoch_id),
      () => {
        setSuccessMsg("Epoch settled successfully!");
      },
      "Settle Epoch"
    );
  };

  const handleOpenEpoch = async () => {
    if (roundInfo.status === 1 && !isExpired) {
      setErrorMsg("A round is already active! Settle it first before opening a new round.");
      return;
    }
    await executeTransaction(
      () => buildOpenEpochTx(pubKey, openDuration),
      () => {
        setSuccessMsg(`Successfully opened Epoch #${roundInfo.epoch_id + 1}!`);
      },
      "Open Epoch"
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full py-6 flex flex-col gap-8 animate-fade-in">
      
      {/* Dynamic Alerts */}
      {errorMsg && (
        <div className="p-4 glass-panel border-red-500/30 text-red-400 rounded-2xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5.5 h-5.5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Transaction Refused</h4>
            <p className="text-[11px] mt-1 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 glass-panel border-accent-secondary/30 text-accent-secondary rounded-2xl flex items-start gap-3 shadow-sm">
          <CheckCircle2 className="w-5.5 h-5.5 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Success</h4>
            <p className="text-[11px] mt-1 leading-relaxed">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Connection Gate */}
      {!pubKey ? (
        <div className="glass-panel-heavy rounded-3xl p-8 sm:p-12 text-center shadow-sm flex flex-col items-center gap-6">
          <Wallet className="w-12 h-12 text-accent-primary animate-pulse-slow" />
          <div>
            <h3 className="text-xl font-black text-white">Wallet Connection Required</h3>
            <p className="text-xs text-text-muted mt-2 max-w-sm mx-auto leading-relaxed">
              Connect your Stellar wallet (Freighter primary) to view your mock XLM balances, approve contract spends, and buy entry_token tokens.
            </p>
          </div>
          <button
            onClick={connectWallet}
            className="glass-button-primary px-8 py-3.5 rounded-xl flex items-center gap-2 text-xs font-bold"
          >
            <Wallet className="w-4.5 h-4.5" />
            Connect Freighter Wallet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Buy Box */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex justify-between items-start border-b border-white/10 pb-6 mb-6">
                <div>
                  <h3 className="text-lg font-black text-white">Enter Active Epoch</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Select entry_token quantity and submit. Every entry_token has an equal draw probability.
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted glass-panel px-2.5 py-1 rounded-md">
                  Epoch #{roundInfo.epoch_id || "1"}
                </span>
              </div>

              {roundInfo.status === 0 && roundInfo.epoch_id > 0 ? (
                <div className="py-8 text-center glass-panel border-red-500/30 p-6 text-red-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">Epoch Voided</h4>
                  <p className="text-xs mt-1">This round was closed with zero entry_token purchases.</p>
                </div>
              ) : roundInfo.status === 2 ? (
                <div className="py-8 text-center glass-panel border-accent-secondary/30 p-6 text-accent-secondary">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">Epoch Settled</h4>
                  <p className="text-xs mt-1">The victor has been drawn and payouts distributed.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Quantity Selector */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">
                      Quantity of EntryTokens
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEntryTokenQty(Math.max(1, entry_tokenQty - 1))}
                        className="w-10 h-10 glass-button rounded-xl flex items-center justify-center font-bold text-sm transition-all"
                      >
                        -
                      </button>
                      <div className="w-16 h-10 glass-panel rounded-xl flex items-center justify-center font-extrabold text-sm text-white">
                        {entry_tokenQty}
                      </div>
                      <button
                        onClick={() => setEntryTokenQty(Math.min(5, entry_tokenQty + 1))}
                        className="w-10 h-10 glass-button rounded-xl flex items-center justify-center font-bold text-sm transition-all"
                      >
                        +
                      </button>
                      <span className="text-[10px] text-text-muted ml-2">
                        Max 5 per txn (prevents sequence clashes)
                      </span>
                    </div>
                  </div>

                  {/* Summary cost */}
                  <div className="glass-panel rounded-2xl p-4 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-text-muted block mb-0.5">Total EntryToken Cost</span>
                      <span className="font-bold text-white">
                        {entry_tokenQty} &times; {fromStroops(pricePerEntryToken)} XLM
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-text-muted block mb-0.5">Stroops</span>
                      <span className="font-bold text-accent-primary">{totalCostStroops.toString()}</span>
                    </div>
                  </div>

                  {/* Buy Button */}
                  {roundInfo.status === 1 && !isExpired && (
                    <button
                      onClick={handleBuyEntryTokens}
                      disabled={loading}
                      className="w-full glass-button-primary py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
                    >
                      <Ticket className="w-4.5 h-4.5" />
                      {loading ? "Processing..." : `Mint EntryTokens (${fromStroops(totalCostStroops)} XLM)`}
                    </button>
                  )}

                  {/* Settle Action */}
                  {roundInfo.status === 1 && isExpired && (
                    <div className="glass-panel-heavy border-accent-primary/30 p-6 rounded-2xl flex flex-col gap-4">
                      <div className="flex gap-2">
                        <Clock className="w-5 h-5 mt-0.5 text-accent-primary flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Epoch Finished!</h4>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            The countdown timer has expired. Users can no longer purchase entry_tokens. Click Settle to draw.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleSettle}
                        disabled={loading}
                        className="w-full glass-button-primary py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 font-bold"
                      >
                        <Coins className="w-4.5 h-4.5" />
                        {loading ? "Settling..." : "Settle Epoch & Draw Winner"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Status column */}
          <div className="flex flex-col gap-6">
            
            {/* Epoch info card */}
            <div className="glass-panel rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/10 pb-2">
                Pool Status
              </h3>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Active Pot</span>
                <span className="font-extrabold text-accent-primary">{fromStroops(BigInt(roundInfo.active_liquidity))} XLM</span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">EntryTokens sold</span>
                <span className="font-extrabold text-white">{roundInfo.entry_token_count} sold</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Closes in</span>
                <span className="font-extrabold text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-accent-primary" />
                  {timeLeft || "Closed"}
                </span>
              </div>
            </div>

            {/* User status card */}
            <div className="glass-panel rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/10 pb-2">
                Your Epoch Stats
              </h3>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Your EntryTokens</span>
                <span className="font-extrabold text-accent-primary flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5" />
                  {userEntryTokens} entry_tokens
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Win Probability</span>
                <span className="font-extrabold text-white">
                  {roundInfo.entry_token_count > 0 ? ((userEntryTokens / roundInfo.entry_token_count) * 100).toFixed(0) : "0"}%
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted">Wallet balance</span>
                <span className="font-extrabold text-white">{parseFloat(balance).toFixed(2)} XLM</span>
              </div>
            </div>

            {/* Admin Panel card */}
            {pubKey && adminAddress && pubKey === adminAddress && (
              <div className="glass-panel border-accent-primary/30 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-accent-primary border-b border-accent-primary/10 pb-2 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  Admin Panel
                </h3>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-text-muted block mb-1">
                      Epoch Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={openDuration}
                      onChange={(e) => setOpenDuration(Math.max(10, parseInt(e.target.value) || 10))}
                      className="w-full glass-panel px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-accent-primary"
                    />
                  </div>

                  <button
                    onClick={handleOpenEpoch}
                    disabled={loading || (roundInfo.status === 1 && !isExpired)}
                    className="w-full glass-button-primary py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 font-bold disabled:opacity-50"
                  >
                    Open New Epoch
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
