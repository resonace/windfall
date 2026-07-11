"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  fetchCurrentEpochId,
  fetchEpochInfo,
  fetchUserEntryTokens,
  fetchXlmBalance,
  fetchAllowance,
  fetchTotalFeeVaultFees,
  submitTx,
  fetchAdmin
} from "../handlers/stellar";

const Web3StateContext = createContext(null);

export function Web3StateProvider({ children }) {
  const [kit, setKit] = useState(null);
  const [pubKey, setPubKey] = useState("");
  const [balance, setBalance] = useState("0");
  const [allowance, setAllowance] = useState("0");
  const [userEntryTokens, setUserEntryTokens] = useState(0);

  const [currentEpochId, setCurrentEpochId] = useState(0);
  const [roundInfo, setEpochInfo] = useState({
    epoch_id: 0,
    status: 0,
    entry_token_price: "0",
    entry_token_count: 0,
    active_liquidity: "0",
    epoch_conclusion: 0,
    victor: null
  });
  const [fee_vaultFees, setFeeVaultFees] = useState("0");
  const [adminAddress, setAdminAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, message }, ...prev].slice(0, 15));
  };

  // Initialize Stellar Wallets Kit on mount.
  // The kit reads localStorage at import time, so it is loaded client-side only
  // via dynamic import inside this effect (never runs during SSR). v2.5.0 exposes
  // a static API — StellarWalletsKit.init(...) — using the documented `/sdk`
  // entry point and the bundled `defaultModules()` (Freighter, Albedo, xBull, …).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      try {
        const [{ StellarWalletsKit }, { defaultModules }, { Networks }] = await Promise.all([
          import("@creit.tech/stellar-wallets-kit/sdk"),
          import("@creit.tech/stellar-wallets-kit/modules/utils"),
          import("@creit.tech/stellar-wallets-kit/types"),
        ]);

        StellarWalletsKit.init({
          network: Networks.TESTNET,
          modules: defaultModules(),
        });
        if (!cancelled) {
          // StellarWalletsKit is a class (a function). Passing it straight to a
          // useState setter would make React treat it as an updater and invoke
          // it ("class constructor cannot be invoked without 'new'"), so store
          // it via the functional-update form.
          setKit(() => StellarWalletsKit);
          addLog("Stellar Wallets Kit initialized.");
        }
      } catch (err) {
        console.error("Error loading wallets kit", err);
        if (!cancelled) setErrorMsg("Failed to initialize wallet kit.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh all state variables.
  // `silent` skips the loading spinner so background polling doesn't flicker
  // the UI or disable action buttons mid-round.
  const refreshData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const roundId = await fetchCurrentEpochId();
      setCurrentEpochId(roundId);

      if (roundId > 0) {
        const info = await fetchEpochInfo(roundId);
        setEpochInfo(info);

        if (pubKey) {
          const entry_tokens = await fetchUserEntryTokens(roundId, pubKey);
          setUserEntryTokens(entry_tokens);
        }
      }

      if (pubKey) {
        const bal = await fetchXlmBalance(pubKey);
        setBalance(bal);

        const allow = await fetchAllowance(pubKey);
        setAllowance(allow);
      }

      const fees = await fetchTotalFeeVaultFees();
      setFeeVaultFees(fees);

      if (!adminAddress) {
        const admin = await fetchAdmin();
        setAdminAddress(admin || "");
      }
    } catch (err) {
      console.error(err);
      if (!silent) setErrorMsg("Failed to query Soroban RPC.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Refresh immediately whenever the connected account changes
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubKey]);

  // Poll on-chain round state so the active_liquidity, entry_token count and status update in
  // near-real-time (e.g. other players buying entry_tokens) without a page reload.
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData(true);
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubKey]);

  // Connect Wallet — opens the kit's auth modal and resolves with the address
  const connectWallet = async () => {
    if (!kit) return;
    setErrorMsg("");
    setLoading(true);
    try {
      const { address } = await kit.authModal({});
      setPubKey(address);
      addLog(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } catch (err) {
      console.error(err);
      // Thrown with { code: -1 } when the user closes the modal.
      setErrorMsg(err?.message || "Wallet connection cancelled.");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect Wallet
  const disconnectWallet = async () => {
    try {
      await kit?.disconnect();
    } catch (err) {
      console.error(err);
    }
    setPubKey("");
    setBalance("0");
    setAllowance("0");
    setUserEntryTokens(0);
    addLog("Wallet disconnected.");
  };

  // Map raw contract traps (simulation/execution panics) to human messages.
  // A trapped guard clause surfaces as "HostError: Error(WasmVm, InvalidAction)
  // ... UnreachableCodeReached" — meaningless to users, so translate per action.
  const friendlyContractError = (actionName, raw) => {
    if (!raw || !/InvalidAction|UnreachableCodeReached|trapped/i.test(raw)) return null;
    if (actionName.startsWith("Buy EntryToken"))
      return "The round timer has expired — entry_tokens can no longer be purchased for this round. Settle the round to draw the victor.";
    if (actionName === "Settle Epoch")
      return "The round can't be settled yet (timer still running), or it was already settled.";
    if (actionName === "Open Epoch")
      return "A round is still active on-chain — settle it before opening a new one.";
    return "The contract rejected this action — the round state has likely changed. The page data has been refreshed.";
  };

  // Sign and submit transactions. Returns true on success, false on failure
  // so callers (e.g. multi-entry_token batches) can stop on the first error.
  const executeTransaction = async (txBuilderFn, successCallback, actionName) => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      if (!pubKey) throw new Error("Wallet not connected");

      addLog(`Preparing transaction: ${actionName}...`);
      const tx = await txBuilderFn();
      const xdrString = tx.toXDR();

      addLog("Signing transaction via Freighter/Albedo...");
      const { signedTxXdr } = await kit.signTransaction(xdrString, { address: pubKey });

      addLog("Submitting transaction to Soroban RPC...");
      const result = await submitTx(signedTxXdr);

      if (result.success) {
        setSuccessMsg(`${actionName} successful!`);
        addLog(`${actionName} confirmed. Hash: ${result.hash.slice(0, 8)}...`);
        if (successCallback) await successCallback();
        await refreshData();
      }
      return true;
    } catch (err) {
      console.error(err);
      const friendly = friendlyContractError(actionName, err?.message);
      setErrorMsg(friendly || err.message || `${actionName} failed.`);
      addLog(`Error during ${actionName}: ${err.message || "Failed"}`);
      // Re-sync on-chain state so stale UI (e.g. a buy button for an
      // already-closed round) corrects itself.
      await refreshData(true);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Web3StateContext.Provider
      value={{
        kit,
        pubKey,
        balance,
        allowance,
        userEntryTokens,
        currentEpochId,
        roundInfo,
        fee_vaultFees,
        adminAddress,
        loading,
        errorMsg,
        successMsg,
        logs,
        setErrorMsg,
        setSuccessMsg,
        addLog,
        connectWallet,
        disconnectWallet,
        refreshData,
        executeTransaction
      }}
    >
      {children}
    </Web3StateContext.Provider>
  );
}

export function useWeb3State() {
  const context = useContext(Web3StateContext);
  if (!context) {
    throw new Error("useWeb3State must be used within a Web3StateProvider");
  }
  return context;
}
