const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { randomUUID } = require('crypto');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

/* =====================================================================
   ZEDMATCH BACKEND — Mobile Money payments (pawaPay, Zambia)

   Environment variables (Vercel -> Project Settings -> Env Variables):
     PAWAPAY_TOKEN  - pawaPay API token. When absent, endpoints report
                      simulated mode and the app uses its local simulation.
     PAWAPAY_ENV    - 'sandbox' (default) or 'production'.

   IMPORTANT: A paid feature must only be unlocked after this server
   confirms the deposit is COMPLETED (see /api/pay/status). The client
   never unlocks premium on its own for a real (non-simulated) payment.
   ===================================================================== */
const PAWAPAY_TOKEN = process.env.PAWAPAY_TOKEN;
const PAWAPAY_BASE = process.env.PAWAPAY_ENV === 'production'
    ? 'https://api.pawapay.io'
    : 'https://api.sandbox.pawapay.io';

// Valid ZedMatch products and their Kwacha prices — the server is the source
// of truth for price, so a tampered client can't pay less than the real price.
const PRICES = {
    premium_month: 79,
    who_liked: 29,
    boost: 19,
    superlike_5: 15
};

const PAWAPAY_PROVIDERS = {
    mtn: 'MTN_MOMO_ZMB',
    airtel: 'AIRTEL_OAPI_ZMB',
    zamtel: 'ZAMTEL_ZMB'
};

const pawapayHeaders = () => ({
    Authorization: `Bearer ${PAWAPAY_TOKEN}`,
    'Content-Type': 'application/json'
});

app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        service: 'zedmatch-backend',
        paymentsConfigured: Boolean(PAWAPAY_TOKEN),
        paymentsEnv: process.env.PAWAPAY_ENV === 'production' ? 'production' : 'sandbox'
    });
});

// Starts a Mobile Money deposit for a ZedMatch premium feature.
// The customer then approves a PIN prompt on their phone; the app polls
// /api/pay/status until it resolves.
app.post('/api/pay', async (req, res) => {
    if (!PAWAPAY_TOKEN) return res.json({ simulated: true });

    const { phone, network, item } = req.body || {};
    const provider = PAWAPAY_PROVIDERS[String(network || '').toLowerCase()];
    const amount = PRICES[item]; // price comes from the server, never the client
    if (!/^(9|7)\d{8}$/.test(String(phone)) || !provider || !(amount > 0)) {
        return res.status(400).json({ error: 'INVALID_INPUT' });
    }

    const depositId = randomUUID();
    try {
        const r = await axios.post(`${PAWAPAY_BASE}/v2/deposits`, {
            depositId,
            amount: String(amount),
            currency: 'ZMW',
            payer: {
                type: 'MMO',
                accountDetails: { phoneNumber: '260' + phone, provider }
            },
            customerMessage: 'ZedMatch premium'
        }, { headers: pawapayHeaders(), timeout: 25000 });

        res.json({ tx_ref: depositId, status: r.data && r.data.status });
    } catch (error) {
        res.status(502).json({
            error: 'PAYMENT_ERROR',
            message: error.message,
            response: error.response ? error.response.data : null
        });
    }
});

// Maps pawaPay deposit statuses onto simple states the app understands.
app.get('/api/pay/status', async (req, res) => {
    if (!PAWAPAY_TOKEN) return res.json({ simulated: true, status: 'successful' });

    try {
        const r = await axios.get(`${PAWAPAY_BASE}/v2/deposits/${encodeURIComponent(req.query.tx_ref || '')}`, {
            headers: pawapayHeaders(),
            timeout: 20000
        });
        const d = r.data && (r.data.data || (Array.isArray(r.data) ? r.data[0] : r.data));
        const s = String((d && d.status) || 'pending').toUpperCase();
        const status = s === 'COMPLETED' ? 'successful'
            : (s === 'FAILED' || s === 'REJECTED' || s === 'CANCELLED') ? 'failed'
            : 'pending';
        res.json({ status });
    } catch (error) {
        // Status often 404s for a moment right after initiation - treat as pending
        res.json({ status: 'pending' });
    }
});

module.exports = app;
