"use strict";
exports.__esModule = true;
// ecosystem.config.ts
// Instead of importing, just export an object
module.exports = {
    apps: [
        {
            name: 'dance-realmx-api',
            script: 'dist/index.js',
            instances: 4,
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 5001,
                FRONTEND_URL: process.env.FRONTEND_URL,
                API_URL: process.env.API_URL,
                STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
                STRIPE_PRICE_SILVER_MONTHLY: process.env.STRIPE_PRICE_SILVER_MONTHLY,
                STRIPE_PRICE_SILVER_YEARLY: process.env.STRIPE_PRICE_SILVER_YEARLY,
                STRIPE_PRICE_GOLD_MONTHLY: process.env.STRIPE_PRICE_GOLD_MONTHLY,
                STRIPE_PRICE_GOLD_YEARLY: process.env.STRIPE_PRICE_GOLD_YEARLY,
                STRIPE_PRICE_PLATINUM_MONTHLY: process.env.STRIPE_PRICE_PLATINUM_MONTHLY,
                STRIPE_PRICE_PLATINUM_YEARLY: process.env.STRIPE_PRICE_PLATINUM_YEARLY,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 5001,
                FRONTEND_URL: process.env.FRONTEND_URL,
                API_URL: process.env.API_URL,
                STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
                STRIPE_PRICE_SILVER_MONTHLY: process.env.STRIPE_PRICE_SILVER_MONTHLY,
                STRIPE_PRICE_SILVER_YEARLY: process.env.STRIPE_PRICE_SILVER_YEARLY,
                STRIPE_PRICE_GOLD_MONTHLY: process.env.STRIPE_PRICE_GOLD_MONTHLY,
                STRIPE_PRICE_GOLD_YEARLY: process.env.STRIPE_PRICE_GOLD_YEARLY,
                STRIPE_PRICE_PLATINUM_MONTHLY: process.env.STRIPE_PRICE_PLATINUM_MONTHLY,
                STRIPE_PRICE_PLATINUM_YEARLY: process.env.STRIPE_PRICE_PLATINUM_YEARLY,
            },
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 5001,
                FRONTEND_URL: process.env.FRONTEND_URL,
                API_URL: process.env.API_URL,
                STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
                STRIPE_PRICE_SILVER_MONTHLY: process.env.STRIPE_PRICE_SILVER_MONTHLY,
                STRIPE_PRICE_SILVER_YEARLY: process.env.STRIPE_PRICE_SILVER_YEARLY,
                STRIPE_PRICE_GOLD_MONTHLY: process.env.STRIPE_PRICE_GOLD_MONTHLY,
                STRIPE_PRICE_GOLD_YEARLY: process.env.STRIPE_PRICE_GOLD_YEARLY,
                STRIPE_PRICE_PLATINUM_MONTHLY: process.env.STRIPE_PRICE_PLATINUM_MONTHLY,
                STRIPE_PRICE_PLATINUM_YEARLY: process.env.STRIPE_PRICE_PLATINUM_YEARLY,
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,
            max_restarts: 5,
            min_uptime: '30s',
            restart_delay: 5000
        },
    ]
};
