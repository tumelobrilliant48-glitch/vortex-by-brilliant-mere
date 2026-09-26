/* =========================================
   VORTEX OMNIVERSE
   PAYMENTS.JS
   Social Platform Payments Engine
   ========================================= */

"use strict";

const VortexPayments = (() => {

    const VERSION = "1.0.0";
    const STORAGE_KEY = "vortex_payments";
    const TRANSACTION_KEY = "vortex_transactions";

    const state = {
        initialized: false,
        provider: null,
        currency: "USD",
        transactions: [],
        methods: [],
        balance: 0,
        loading: false,
        lastError: null
    };

    const listeners = {};

    /* =========================================
       EVENTS
       ========================================= */

    function on(event, callback) {
        if (typeof callback !== "function") return () => {};
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);

        return () => {
            listeners[event] =
                (listeners[event] || []).filter(fn => fn !== callback);
        };
    }

    function emit(event, data = {}) {
        (listeners[event] || []).forEach(fn => {
            try {
                fn(data);
            } catch (error) {
                console.error("[VortexPayments]", error);
            }
        });

        window.dispatchEvent(
            new CustomEvent(`vortex:payments:${event}`, {
                detail: data
            })
        );
    }

    /* =========================================
       USER
       ========================================= */

    function getUserId() {
        return (
            window.VortexAuth?.getUserId?.() ||
            window.VortexUser?.getCurrentUser?.()?.id ||
            window.VortexProfile?.getCurrentProfile?.()?.id ||
            "guest"
        );
    }

    function getUser() {
        return (
            window.VortexAuth?.getCurrentUser?.() ||
            window.VortexUser?.getCurrentUser?.() ||
            window.VortexProfile?.getCurrentProfile?.() ||
            null
        );
    }

    /* =========================================
       STORAGE
       ========================================= */

    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);

                state.provider = data.provider || null;
                state.currency = data.currency || "USD";
                state.methods = Array.isArray(data.methods)
                    ? data.methods
                    : [];
                state.balance = Number(data.balance || 0);
            }

            const transactions =
                localStorage.getItem(TRANSACTION_KEY);

            state.transactions = transactions
                ? JSON.parse(transactions)
                : [];

            if (!Array.isArray(state.transactions)) {
                state.transactions = [];
            }

        } catch (error) {
            console.error(
                "[VortexPayments] Storage load failed:",
                error
            );

            state.transactions = [];
            state.methods = [];
        }
    }

    function save() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    provider: state.provider,
                    currency: state.currency,
                    methods: state.methods,
                    balance: state.balance
                })
            );

            localStorage.setItem(
                TRANSACTION_KEY,
                JSON.stringify(state.transactions)
            );
        } catch (error) {
            console.error(
                "[VortexPayments] Storage save failed:",
                error
            );
        }
    }

    /* =========================================
       ID
       ========================================= */

    function createId(prefix = "pay") {
        return (
            prefix +
            "_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .slice(2, 10)
        );
    }

    /* =========================================
       CONFIGURATION
       ========================================= */

    function configure(options = {}) {
        if (options.provider !== undefined) {
            state.provider = options.provider;
        }

        if (options.currency) {
            state.currency =
                String(options.currency).toUpperCase();
        }

        save();

        emit("configured", {
            provider: state.provider,
            currency: state.currency
        });

        return getConfig();
    }

    function getConfig() {
        return {
            provider: state.provider,
            currency: state.currency,
            configured: Boolean(state.provider)
        };
    }

    function setProvider(provider) {
        state.provider = provider || null;
        save();

        emit("providerChanged", {
            provider: state.provider
        });
    }

    function setCurrency(currency) {
        if (!currency) return;

        state.currency =
            String(currency).toUpperCase();

        save();

        emit("currencyChanged", {
            currency: state.currency
        });
    }

    /* =========================================
       PAYMENT PROVIDER BRIDGE
       ========================================= */

    async function providerRequest(action, payload = {}) {

        if (window.VortexBackend?.isConfigured?.()) {

            return window.VortexBackend.post(
                "/payments/" + action,
                payload
            );
        }

        if (window.VortexAPI?.post) {

            return window.VortexAPI.post(
                "/payments/" + action,
                payload
            );
        }

        throw new Error(
            "Payment provider/backend is not configured."
        );
    }

    /* =========================================
       PAYMENT METHOD
       ========================================= */

    function addPaymentMethod(method = {}) {

        const item = {
            id: createId("method"),
            type: method.type || "unknown",
            provider: method.provider || null,
            brand: method.brand || null,
            last4: method.last4
                ? String(method.last4).slice(-4)
                : null,
            label: method.label || null,
            createdAt: Date.now(),
            default: Boolean(method.default)
        };

        if (item.default) {
            state.methods.forEach(
                method => method.default = false
            );
        }

        state.methods.push(item);

        save();

        emit("paymentMethodAdded", {
            method: item
        });

        return item;
    }

    function getPaymentMethods() {
        return state.methods.map(method => ({
            ...method
        }));
    }

    function getPaymentMethod(id) {
        return state.methods.find(
            method => method.id === id
        ) || null;
    }

    function setDefaultPaymentMethod(id) {

        const method = getPaymentMethod(id);

        if (!method) {
            throw new Error(
                "Payment method not found."
            );
        }

        state.methods.forEach(item => {
            item.default = item.id === id;
        });

        save();

        emit("paymentMethodDefault", {
            method
        });

        return method;
    }

    function removePaymentMethod(id) {

        const index = state.methods.findIndex(
            method => method.id === id
        );

        if (index === -1) return false;

        const removed =
            state.methods.splice(index, 1)[0];

        save();

        emit("paymentMethodRemoved", {
            method: removed
        });

        return true;
    }

    function getDefaultPaymentMethod() {
        return (
            state.methods.find(
                method => method.default
            ) ||
            state.methods[0] ||
            null
        );
    }

    /* =========================================
       TRANSACTIONS
       ========================================= */

    function createTransaction(data = {}) {

        const transaction = {
            id: createId("txn"),
            userId: data.userId || getUserId(),

            type: data.type || "payment",

            status: data.status || "pending",

            amount: Number(data.amount || 0),

            currency:
                data.currency ||
                state.currency,

            description:
                data.description ||
                "VORTEX payment",

            recipientId:
                data.recipientId || null,

            creatorId:
                data.creatorId || null,

            orderId:
                data.orderId || null,

            paymentMethodId:
                data.paymentMethodId || null,

            provider:
                data.provider ||
                state.provider ||
                null,

            providerTransactionId:
                data.providerTransactionId ||
                null,

            metadata:
                data.metadata || {},

            createdAt: Date.now(),

            updatedAt: Date.now()
        };

        state.transactions.unshift(transaction);

        save();

        emit("transactionCreated", {
            transaction
        });

        return transaction;
    }

    function updateTransaction(id, updates = {}) {

        const transaction =
            state.transactions.find(
                item => item.id === id
            );

        if (!transaction) return null;

        Object.assign(transaction, updates, {
            updatedAt: Date.now()
        });

        save();

        emit("transactionUpdated", {
            transaction
        });

        return transaction;
    }

    function getTransaction(id) {
        return (
            state.transactions.find(
                transaction =>
                    transaction.id === id
            ) || null
        );
    }

    function getTransactions(options = {}) {

        let results =
            state.transactions.filter(
                transaction =>
                    transaction.userId === getUserId()
            );

        if (options.type) {
            results = results.filter(
                transaction =>
                    transaction.type === options.type
            );
        }

        if (options.status) {
            results = results.filter(
                transaction =>
                    transaction.status === options.status
            );
        }

        if (options.limit) {
            results =
                results.slice(0, Number(options.limit));
        }

        return results;
    }

    /* =========================================
       CHECKOUT
       ========================================= */

    async function createCheckout(options = {}) {

        const amount = Number(options.amount || 0);

        if (!Number.isFinite(amount) || amount <= 0) {
            throw new Error(
                "A valid payment amount is required."
            );
        }

        const transaction =
            createTransaction({
                type: options.type || "checkout",
                amount,
                currency:
                    options.currency ||
                    state.currency,
                description:
                    options.description ||
                    "VORTEX checkout",
                recipientId:
                    options.recipientId || null,
                creatorId:
                    options.creatorId || null,
                orderId:
                    options.orderId || null,
                paymentMethodId:
                    options.paymentMethodId ||
                    getDefaultPaymentMethod()?.id ||
                    null,
                metadata:
                    options.metadata || {}
            });

        try {

            const response =
                await providerRequest(
                    "checkout",
                    {
                        transactionId:
                            transaction.id,

                        amount:
                            transaction.amount,

                        currency:
                            transaction.currency,

                        description:
                            transaction.description,

                        recipientId:
                            transaction.recipientId,

                        creatorId:
                            transaction.creatorId,

                        orderId:
                            transaction.orderId,

                        metadata:
                            transaction.metadata
                    }
                );

            updateTransaction(
                transaction.id,
                {
                    status:
                        response?.status ||
                        "processing",

                    providerTransactionId:
                        response?.transactionId ||
                        response?.id ||
                        null,

                    checkoutUrl:
                        response?.checkoutUrl ||
                        response?.url ||
                        null
                }
            );

            return {
                success: true,
                transaction:
                    getTransaction(transaction.id),

                providerResponse:
                    response
            };

        } catch (error) {

            updateTransaction(
                transaction.id,
                {
                    status: "provider_unavailable",
                    error: error.message
                }
            );

            state.lastError = error.message;

            emit("paymentError", {
                transaction,
                error
            });

            return {
                success: false,
                transaction:
                    getTransaction(transaction.id),

                error: error.message
            };
        }
    }

    /* =========================================
       PAYMENT CONFIRMATION
       ========================================= */

    async function confirmPayment(
        transactionId,
        providerData = {}
    ) {

        const transaction =
            getTransaction(transactionId);

        if (!transaction) {
            throw new Error(
                "Transaction not found."
            );
        }

        try {

            const response =
                await providerRequest(
                    "confirm",
                    {
                        transactionId,
                        providerData
                    }
                );

            const status =
                response?.status ||
                "completed";

            updateTransaction(
                transactionId,
                {
                    status,
                    providerTransactionId:
                        response?.transactionId ||
                        providerData.transactionId ||
                        transaction.providerTransactionId ||
                        null,

                    confirmedAt:
                        status === "completed"
                            ? Date.now()
                            : null
                }
            );

            if (status === "completed") {

                emit("paymentCompleted", {
                    transaction:
                        getTransaction(transactionId)
                });
            }

            return {
                success: true,
                transaction:
                    getTransaction(transactionId),

                response
            };

        } catch (error) {

            updateTransaction(
                transactionId,
                {
                    status: "confirmation_failed",
                    error: error.message
                }
            );

            return {
                success: false,
                error: error.message
            };
        }
    }

    /* =========================================
       CREATOR SUPPORT / TIPS
       ========================================= */

    async function sendCreatorTip(options = {}) {

        const creatorId =
            options.creatorId;

        const amount =
            Number(options.amount || 0);

        if (!creatorId) {
            throw new Error(
                "Creator ID is required."
            );
        }

        if (!amount || amount <= 0) {
            throw new Error(
                "Tip amount must be greater than zero."
            );
        }

        return createCheckout({
            type: "creator_tip",
            amount,
            currency:
                options.currency ||
                state.currency,

            description:
                options.message ||
                "Creator support",

            creatorId,

            metadata: {
                message:
                    options.message || ""
            }
        });
    }

    /* =========================================
       PREMIUM CONTENT
       ========================================= */

    async function purchasePremium(options = {}) {

        const contentId =
            options.contentId;

        const amount =
            Number(options.amount || 0);

        if (!contentId) {
            throw new Error(
                "Premium content ID is required."
            );
        }

        if (!amount || amount <= 0) {
            throw new Error(
                "Premium content price must be greater than zero."
            );
        }

        return createCheckout({
            type: "premium_content",
            amount,

            currency:
                options.currency ||
                state.currency,

            description:
                options.description ||
                "VORTEX premium content",

            recipientId:
                options.creatorId ||
                null,

            creatorId:
                options.creatorId ||
                null,

            metadata: {
                contentId
            }
        });
    }

    /* =========================================
       VORTEX PREMIUM
       ========================================= */

    async function purchasePremiumPlan(options = {}) {

        const plan =
            options.plan || "monthly";

        const prices = {
            monthly: Number(
                options.monthlyPrice || 5
            ),

            yearly: Number(
                options.yearlyPrice || 50
            )
        };

        const amount =
            options.amount ||
            prices[plan] ||
            prices.monthly;

        return createCheckout({
            type: "vortex_premium",
            amount,

            currency:
                options.currency ||
                state.currency,

            description:
                `VORTEX Premium - ${plan}`,

            metadata: {
                plan
            }
        });
    }

    /* =========================================
       MARKETPLACE
       ========================================= */

    async function purchaseMarketplaceItem(
        options = {}
    ) {

        const amount =
            Number(options.amount || 0);

        if (!options.itemId) {
            throw new Error(
                "Marketplace item ID is required."
            );
        }

        if (amount <= 0) {
            throw new Error(
                "Marketplace amount must be greater than zero."
            );
        }

        return createCheckout({
            type: "marketplace_purchase",
            amount,

            currency:
                options.currency ||
                state.currency,

            description:
                options.description ||
                "VORTEX Marketplace purchase",

            recipientId:
                options.sellerId ||
                null,

            orderId:
                options.orderId ||
                null,

            metadata: {
                itemId:
                    options.itemId
            }
        });
    }

    /* =========================================
       REFUNDS
       ========================================= */

    async function requestRefund(
        transactionId,
        reason = ""
    ) {

        const transaction =
            getTransaction(transactionId);

        if (!transaction) {
            throw new Error(
                "Transaction not found."
            );
        }

        if (
            transaction.status !== "completed"
        ) {
            throw new Error(
                "Only completed payments can be refunded."
            );
        }

        try {

            const response =
                await providerRequest(
                    "refund",
                    {
                        transactionId,
                        reason
                    }
                );

            updateTransaction(
                transactionId,
                {
                    status:
                        response?.status ||
                        "refund_requested",

                    refundReason:
                        reason,

                    refundRequestedAt:
                        Date.now()
                }
            );

            emit("refundRequested", {
                transaction:
                    getTransaction(transactionId)
            });

            return {
                success: true,
                transaction:
                    getTransaction(transactionId),

                response
            };

        } catch (error) {

            return {
                success: false,
                error: error.message
            };
        }
    }

    /* =========================================
       CREATOR EARNINGS
       ========================================= */

    function getCreatorEarnings(
        creatorId,
        options = {}
    ) {

        if (!creatorId) return 0;

        const transactions =
            state.transactions.filter(
                transaction =>
                    transaction.creatorId === creatorId &&
                    transaction.status === "completed" &&
                    (
                        transaction.type ===
                            "creator_tip" ||

                        transaction.type ===
                            "premium_content" ||

                        transaction.type ===
                            "marketplace_purchase"
                    )
            );

        let total = transactions.reduce(
            (sum, transaction) =>
                sum + Number(transaction.amount || 0),
            0
        );

        if (options.platformFee) {

            const fee =
                Number(options.platformFee);

            total -= total * fee;
        }

        return Math.max(0, total);
    }

    /* =========================================
       VORTEX REVENUE
       ========================================= */

    function getPlatformRevenue(
        platformFee = 0.10
    ) {

        const completed =
            state.transactions.filter(
                transaction =>
                    transaction.status ===
                    "completed"
            );

        return completed.reduce(
            (sum, transaction) =>
                sum +
                Number(transaction.amount || 0) *
                Number(platformFee),
            0
        );
    }

    /* =========================================
       BALANCE
       ========================================= */

    function getBalance() {
        return Number(state.balance || 0);
    }

    function setBalance(amount) {

        state.balance =
            Math.max(0, Number(amount || 0));

        save();

        emit("balanceChanged", {
            balance:
                state.balance
        });

        return state.balance;
    }

    /* =========================================
       PAYOUT
       ========================================= */

    async function requestCreatorPayout(options = {}) {

        const amount =
            Number(options.amount || 0);

        const creatorId =
            options.creatorId ||
            getUserId();

        if (amount <= 0) {
            throw new Error(
                "Payout amount must be greater than zero."
            );
        }

        const available =
            getCreatorEarnings(
                creatorId
            );

        if (amount > available) {
            throw new Error(
                "Payout amount exceeds available earnings."
            );
        }

        try {

            const response =
                await providerRequest(
                    "payout",
                    {
                        creatorId,
                        amount,

                        currency:
                            options.currency ||
                            state.currency,

                        payoutMethod:
                            options.payoutMethod ||
                            null
                    }
                );

            emit("payoutRequested", {
                creatorId,
                amount,
                response
            });

            return {
                success: true,
                creatorId,
                amount,
                response
            };

        } catch (error) {

            return {
                success: false,
                error: error.message
            };
        }
    }

    /* =========================================
       CHECK PAYMENT STATUS
       ========================================= */

    async function refreshTransaction(
        transactionId
    ) {

        const transaction =
            getTransaction(transactionId);

        if (!transaction) {
            throw new Error(
                "Transaction not found."
            );
        }

        try {

            const response =
                await providerRequest(
                    `transactions/${transactionId}`,
                    {}
                );

            if (response?.status) {

                updateTransaction(
                    transactionId,
                    {
                        status:
                            response.status
                    }
                );
            }

            return {
                success: true,
                transaction:
                    getTransaction(transactionId),

                response
            };

        } catch (error) {

            return {
                success: false,
                error: error.message
            };
        }
    }

    /* =========================================
       TOTALS
       ========================================= */

    function getTotals() {

        const transactions =
            getTransactions();

        const completed =
            transactions.filter(
                item =>
                    item.status === "completed"
            );

        const pending =
            transactions.filter(
                item =>
                    item.status === "pending" ||
                    item.status === "processing"
            );

        const spent =
            completed.reduce(
                (sum, item) =>
                    sum + Number(item.amount || 0),
                0
            );

        return {
            totalTransactions:
                transactions.length,

            completed:
                completed.length,

            pending:
                pending.length,

            spent,

            currency:
                state.currency
        };
    }

    /* =========================================
       SECURITY HELPERS
       ========================================= */

    function maskPaymentMethod(method) {

        if (!method) return null;

        return {
            ...method,

            last4:
                method.last4
                    ? `•••• ${method.last4}`
                    : null
        };
    }

    function sanitizeTransaction(transaction) {

        if (!transaction) return null;

        const copy = {
            ...transaction
        };

        delete copy.secret;
        delete copy.password;
        delete copy.token;
        delete copy.privateKey;

        return copy;
    }

    /* =========================================
       DASHBOARD DATA
       ========================================= */

    function getDashboard() {

        const user =
            getUser();

        const totals =
            getTotals();

        const methods =
            getPaymentMethods()
                .map(maskPaymentMethod);

        return {
            user,
            currency:
                state.currency,

            balance:
                getBalance(),

            methods,

            totals,

            recentTransactions:
                getTransactions({
                    limit: 10
                }).map(
                    sanitizeTransaction
                ),

            provider:
                state.provider
        };
    }

    /* =========================================
       UI
       ========================================= */

    function renderDashboard(container) {

        if (!container) return;

        const data =
            getDashboard();

        const transactions =
            data.recentTransactions
                .map(transaction => {

                    const statusClass =
                        transaction.status
                            .replace(
                                /[^a-z0-9_-]/gi,
                                ""
                            );

                    return `
                        <div class="vortex-payment-row">

                            <div class="vortex-payment-icon">
                                ${transaction.status === "completed"
                                    ? "✓"
                                    : transaction.status === "pending"
                                    ? "⏳"
                                    : "₿"}
                            </div>

                            <div class="vortex-payment-info">

                                <strong>
                                    ${escapeHTML(
                                        transaction.description
                                    )}
                                </strong>

                                <small>
                                    ${formatDate(
                                        transaction.createdAt
                                    )}
                                </small>

                            </div>

                            <div class="vortex-payment-amount">

                                <strong>
                                    ${formatMoney(
                                        transaction.amount,
                                        transaction.currency
                                    )}
                                </strong>

                                <span class="
                                    vortex-payment-status
                                    ${statusClass}
                                ">
                                    ${escapeHTML(
                                        transaction.status
                                    )}
                                </span>

                            </div>

                        </div>
                    `;
                })
                .join("");

        container.innerHTML = `
            <section class="vortex-payments-dashboard">

                <div class="vortex-payment-header">

                    <div>
                        <span class="vortex-payment-label">
                            VORTEX PAYMENTS
                        </span>

                        <h2>
                            Payments
                        </h2>

                        <p>
                            Manage purchases, creator support
                            and payment activity.
                        </p>
                    </div>

                    <div class="vortex-payment-balance">
                        <span>
                            Balance
                        </span>

                        <strong>
                            ${formatMoney(
                                data.balance,
                                data.currency
                            )}
                        </strong>
                    </div>

                </div>

                <div class="vortex-payment-stats">

                    <div>
                        <span>Transactions</span>
                        <strong>
                            ${data.totals.totalTransactions}
                        </strong>
                    </div>

                    <div>
                        <span>Completed</span>
                        <strong>
                            ${data.totals.completed}
                        </strong>
                    </div>

                    <div>
                        <span>Pending</span>
                        <strong>
                            ${data.totals.pending}
                        </strong>
                    </div>

                    <div>
                        <span>Total</span>
                        <strong>
                            ${formatMoney(
                                data.totals.spent,
                                data.currency
                            )}
                        </strong>
                    </div>

                </div>

                <div class="vortex-payment-card">

                    <div class="vortex-payment-card-title">
                        Payment Methods
                    </div>

                    ${
                        data.methods.length
                            ? data.methods
                                .map(method => `
                                    <div class="
                                        vortex-method-row
                                    ">

                                        <span>
                                            ${escapeHTML(
                                                method.type
                                            )}
                                        </span>

                                        <strong>
                                            ${escapeHTML(
                                                method.last4 ||
                                                method.label ||
                                                "Connected"
                                            )}
                                        </strong>

                                    </div>
                                `)
                                .join("")
                            : `
                                <div class="
                                    vortex-payment-empty
                                ">
                                    No payment methods connected.
                                </div>
                            `
                    }

                </div>

                <div class="vortex-payment-card">

                    <div class="vortex-payment-card-title">
                        Recent Activity
                    </div>

                    ${
                        transactions ||
                        `
                        <div class="vortex-payment-empty">
                            No payment activity yet.
                        </div>
                        `
                    }

                </div>

            </section>

            ${paymentStyles()}
        `;
    }

    /* =========================================
       FORMATTING
       ========================================= */

    function formatMoney(amount, currency) {

        try {

            return new Intl.NumberFormat(
                undefined,
                {
                    style: "currency",
                    currency:
                        currency ||
                        state.currency
                }
            ).format(
                Number(amount || 0)
            );

        } catch {
            return `${currency || state.currency} ${Number(
                amount || 0
            ).toFixed(2)}`;
        }
    }

    function formatDate(timestamp) {

        if (!timestamp) return "";

        try {

            return new Date(timestamp)
                .toLocaleString();

        } catch {
            return "";
        }
    }

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =========================================
       STYLES
       ========================================= */

    function paymentStyles() {

        if (
            document.getElementById(
                "vortex-payment-styles"
            )
        ) {
            return "";
        }

        return `
            <style id="vortex-payment-styles">

                .vortex-payments-dashboard {
                    width: 100%;
                    max-width: 900px;
                    margin: auto;
                    padding: 20px;
                    color: #fff;
                    font-family:
                        Inter,
                        system-ui,
                        sans-serif;
                }

                .vortex-payment-header {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 24px;
                    border-radius: 24px;
                    background:
                        linear-gradient(
                            135deg,
                            rgba(0,217,255,.14),
                            rgba(139,77,255,.14)
                        );
                    border: 1px solid
                        rgba(0,217,255,.16);
                    box-shadow:
                        0 0 40px
                        rgba(0,217,255,.05);
                }

                .vortex-payment-label {
                    color: #00d9ff;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                }

                .vortex-payment-header h2 {
                    margin: 8px 0;
                    font-size: 30px;
                }

                .vortex-payment-header p {
                    margin: 0;
                    color: #9da7bd;
                }

                .vortex-payment-balance {
                    min-width: 150px;
                    padding: 18px;
                    border-radius: 18px;
                    background:
                        rgba(0,0,0,.28);
                    text-align: right;
                }

                .vortex-payment-balance span {
                    display: block;
                    color: #8f99ad;
                    font-size: 12px;
                }

                .vortex-payment-balance strong {
                    display: block;
                    margin-top: 6px;
                    font-size: 24px;
                    color: #00d9ff;
                }

                .vortex-payment-stats {
                    display: grid;
                    grid-template-columns:
                        repeat(4, 1fr);
                    gap: 12px;
                    margin: 15px 0;
                }

                .vortex-payment-stats > div {
                    padding: 17px;
                    border-radius: 18px;
                    background:
                        rgba(255,255,255,.035);
                    border: 1px solid
                        rgba(255,255,255,.07);
                }

                .vortex-payment-stats span {
                    display: block;
                    color: #8994aa;
                    font-size: 12px;
                }

                .vortex-payment-stats strong {
                    display: block;
                    margin-top: 7px;
                    font-size: 20px;
                }

                .vortex-payment-card {
                    margin-top: 15px;
                    padding: 18px;
                    border-radius: 22px;
                    background:
                        rgba(255,255,255,.035);
                    border: 1px solid
                        rgba(255,255,255,.07);
                }

                .vortex-payment-card-title {
                    margin-bottom: 12px;
                    font-weight: 800;
                }

                .vortex-payment-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 13px 0;
                    border-bottom: 1px solid
                        rgba(255,255,255,.06);
                }

                .vortex-payment-row:last-child {
                    border-bottom: 0;
                }

                .vortex-payment-icon {
                    width: 40px;
                    height: 40px;
                    display: grid;
                    place-items: center;
                    border-radius: 13px;
                    background:
                        rgba(0,217,255,.09);
                    color: #00d9ff;
                    font-weight: 900;
                }

                .vortex-payment-info {
                    flex: 1;
                    min-width: 0;
                }

                .vortex-payment-info strong {
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .vortex-payment-info small {
                    display: block;
                    margin-top: 4px;
                    color: #7f8aa1;
                }

                .vortex-payment-amount {
                    text-align: right;
                }

                .vortex-payment-status {
                    display: block;
                    margin-top: 4px;
                    font-size: 10px;
                    color: #8c97aa;
                }

                .vortex-payment-status.completed {
                    color: #3dffae;
                }

                .vortex-payment-status.pending,
                .vortex-payment-status.processing {
                    color: #ffd166;
                }

                .vortex-payment-status.failed,
                .vortex-payment-status.cancelled {
                    color: #ff5577;
                }

                .vortex-method-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 13px 0;
                    border-bottom: 1px solid
                        rgba(255,255,255,.06);
                }

                .vortex-method-row:last-child {
                    border-bottom: 0;
                }

                .vortex-method-row span {
                    color: #8d98ad;
                }

                .vortex-payment-empty {
                    padding: 25px 5px;
                    text-align: center;
                    color: #7d879a;
                }

                @media (max-width: 650px) {

                    .vortex-payment-header {
                        flex-direction: column;
                    }

                    .vortex-payment-balance {
                        text-align: left;
                    }

                    .vortex-payment-stats {
                        grid-template-columns:
                            repeat(2, 1fr);
                    }

                }

            </style>
        `;
    }

    /* =========================================
       INIT
       ========================================= */

    function init() {

        if (state.initialized) {
            return getStatus();
        }

        load();

        state.initialized = true;

        emit("ready", {
            version: VERSION
        });

        return getStatus();
    }

    function getStatus() {

        return {
            version: VERSION,
            initialized:
                state.initialized,

            provider:
                state.provider,

            currency:
                state.currency,

            configured:
                Boolean(state.provider),

            transactionCount:
                state.transactions.length,

            paymentMethodCount:
                state.methods.length,

            balance:
                state.balance,

            lastError:
                state.lastError
        };
    }

    /* =========================================
       RESET
       ========================================= */

    function clearTransactions() {

        state.transactions = [];

        save();

        emit("transactionsCleared");
    }

    function reset() {

        state.provider = null;
        state.currency = "USD";
        state.transactions = [];
        state.methods = [];
        state.balance = 0;
        state.lastError = null;

        save();

        emit("reset");
    }

    /* =========================================
       PUBLIC API
       ========================================= */

    return {

        VERSION,

        init,
        on,

        configure,
        getConfig,
        setProvider,
        setCurrency,

        addPaymentMethod,
        getPaymentMethods,
        getPaymentMethod,
        setDefaultPaymentMethod,
        removePaymentMethod,
        getDefaultPaymentMethod,

        createTransaction,
        updateTransaction,
        getTransaction,
        getTransactions,

        createCheckout,
        confirmPayment,
        refreshTransaction,

        sendCreatorTip,
        purchasePremium,
        purchasePremiumPlan,
        purchaseMarketplaceItem,

        requestRefund,

        getCreatorEarnings,
        getPlatformRevenue,

        getBalance,
        setBalance,

        requestCreatorPayout,

        getTotals,
        getDashboard,

        renderDashboard,

        formatMoney,
        formatDate,

        clearTransactions,
        reset,

        getStatus
    };

})();

/* =========================================
   GLOBAL
   ========================================= */

window.VortexPayments = VortexPayments;

/* Optional compatibility aliases */
window.VortexPayment = VortexPayments;

/* =========================================
   AUTO INIT
   ========================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => VortexPayments.init(),
        { once: true }
    );

} else {

    VortexPayments.init();

          }
