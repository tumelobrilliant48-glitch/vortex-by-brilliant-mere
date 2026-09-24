/* =========================================================
   VORTEX — Wallet Engine
   File: wallet.js
   Purpose: Virtual VORTEX currency & transaction system
   ========================================================= */

(function () {
  "use strict";

  const WALLET_KEY = "vortex_wallets";
  const TRANSACTIONS_KEY = "vortex_transactions";

  /* ---------------------------------------------------------
     Storage
  --------------------------------------------------------- */

  function getWallets() {
    try {
      return JSON.parse(localStorage.getItem(WALLET_KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveWallets(wallets) {
    localStorage.setItem(
      WALLET_KEY,
      JSON.stringify(wallets)
    );
  }

  function getTransactions() {
    try {
      return JSON.parse(
        localStorage.getItem(TRANSACTIONS_KEY)
      ) || [];
    } catch {
      return [];
    }
  }

  function saveTransactions(transactions) {
    localStorage.setItem(
      TRANSACTIONS_KEY,
      JSON.stringify(transactions)
    );
  }

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */

  function getCurrentUser() {
    if (
      window.VortexAuth &&
      typeof window.VortexAuth.currentUser === "function"
    ) {
      return window.VortexAuth.currentUser();
    }

    return null;
  }

  function createTransactionId() {
    return (
      "txn_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 9)
    );
  }

  function ensureWallet(userId) {
    const wallets = getWallets();

    if (!wallets[userId]) {
      wallets[userId] = {
        userId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        createdAt: Date.now()
      };

      saveWallets(wallets);
    }

    return wallets[userId];
  }

  /* ---------------------------------------------------------
     Get wallet
  --------------------------------------------------------- */

  function getWallet(userId) {
    const user = getCurrentUser();

    const id = userId || user?.id;

    if (!id) {
      return {
        success: false,
        error: "No authenticated user."
      };
    }

    return {
      success: true,
      wallet: ensureWallet(id)
    };
  }

  /* ---------------------------------------------------------
     Balance
  --------------------------------------------------------- */

  function getBalance(userId) {
    const result = getWallet(userId);

    if (!result.success) {
      return 0;
    }

    return Number(result.wallet.balance) || 0;
  }

  /* ---------------------------------------------------------
     Add virtual VORTEX tokens
  --------------------------------------------------------- */

  function credit(amount, reason = "VORTEX reward", userId) {
    const user = getCurrentUser();
    const id = userId || user?.id;

    amount = Number(amount);

    if (!id) {
      return {
        success: false,
        error: "No authenticated user."
      };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        error: "Invalid amount."
      };
    }

    const wallets = getWallets();
    const wallet = ensureWallet(id);

    wallet.balance += amount;
    wallet.lifetimeEarned += amount;

    wallets[id] = wallet;
    saveWallets(wallets);

    recordTransaction({
      userId: id,
      type: "credit",
      amount,
      reason
    });

    emitWalletChange(wallet);

    return {
      success: true,
      balance: wallet.balance,
      amount
    };
  }

  /* ---------------------------------------------------------
     Spend virtual VORTEX tokens
  --------------------------------------------------------- */

  function debit(amount, reason = "VORTEX purchase", userId) {
    const user = getCurrentUser();
    const id = userId || user?.id;

    amount = Number(amount);

    if (!id) {
      return {
        success: false,
        error: "No authenticated user."
      };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        error: "Invalid amount."
      };
    }

    const wallets = getWallets();
    const wallet = ensureWallet(id);

    if (wallet.balance < amount) {
      return {
        success: false,
        error: "Insufficient VORTEX balance."
      };
    }

    wallet.balance -= amount;
    wallet.lifetimeSpent += amount;

    wallets[id] = wallet;
    saveWallets(wallets);

    recordTransaction({
      userId: id,
      type: "debit",
      amount,
      reason
    });

    emitWalletChange(wallet);

    return {
      success: true,
      balance: wallet.balance,
      amount
    };
  }

  /* ---------------------------------------------------------
     Transfer virtual currency
  --------------------------------------------------------- */

  function transfer(recipientId, amount, reason = "VORTEX transfer") {
    const sender = getCurrentUser();

    if (!sender) {
      return {
        success: false,
        error: "You must be logged in."
      };
    }

    if (!recipientId || recipientId === sender.id) {
      return {
        success: false,
        error: "Invalid recipient."
      };
    }

    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        error: "Invalid amount."
      };
    }

    const senderWallet = ensureWallet(sender.id);

    if (senderWallet.balance < amount) {
      return {
        success: false,
        error: "Insufficient VORTEX balance."
      };
    }

    const recipientWallet = ensureWallet(recipientId);

    senderWallet.balance -= amount;
    senderWallet.lifetimeSpent += amount;

    recipientWallet.balance += amount;
    recipientWallet.lifetimeEarned += amount;

    const wallets = getWallets();

    wallets[sender.id] = senderWallet;
    wallets[recipientId] = recipientWallet;

    saveWallets(wallets);

    recordTransaction({
      userId: sender.id,
      relatedUserId: recipientId,
      type: "transfer_sent",
      amount,
      reason
    });

    recordTransaction({
      userId: recipientId,
      relatedUserId: sender.id,
      type: "transfer_received",
      amount,
      reason
    });

    emitWalletChange(senderWallet);

    return {
      success: true,
      balance: senderWallet.balance
    };
  }

  /* ---------------------------------------------------------
     Creator reward
  --------------------------------------------------------- */

  function rewardCreator(creatorId, amount, reason = "Creator reward") {
    if (!creatorId) {
      return {
        success: false,
        error: "Creator ID is required."
      };
    }

    return credit(
      amount,
      reason,
      creatorId
    );
  }

  /* ---------------------------------------------------------
     Transaction history
  --------------------------------------------------------- */

  function recordTransaction(data) {
    const transactions = getTransactions();

    transactions.unshift({
      id: createTransactionId(),
      ...data,
      createdAt: Date.now()
    });

    /*
      Keep the local prototype from growing indefinitely.
    */

    if (transactions.length > 1000) {
      transactions.length = 1000;
    }

    saveTransactions(transactions);
  }

  function getHistory(userId, limit = 50) {
    const user = getCurrentUser();
    const id = userId || user?.id;

    if (!id) {
      return [];
    }

    return getTransactions()
      .filter(transaction => transaction.userId === id)
      .slice(0, Number(limit) || 50);
  }

  /* ---------------------------------------------------------
     Daily reward
  --------------------------------------------------------- */

  function claimDailyReward() {
    const user = getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in."
      };
    }

    const rewardKey =
      "vortex_daily_reward_" + user.id;

    const lastClaim =
      Number(localStorage.getItem(rewardKey)) || 0;

    const oneDay = 24 * 60 * 60 * 1000;

    if (Date.now() - lastClaim < oneDay) {
      return {
        success: false,
        error: "Daily reward has already been claimed."
      };
