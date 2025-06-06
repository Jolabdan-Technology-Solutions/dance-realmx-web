"use strict";
exports.__esModule = true;
// ecosystem.config.ts
// Instead of importing, just export an object
module.exports = {
    apps: [
        {
            name: 'dance-realmx-api',
            script: 'dist/index.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 5001,
                FRONTEND_URL: process.env.FRONTEND_URL,
                API_URL: process.env.API_URL,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 5001,
                FRONTEND_URL: process.env.FRONTEND_URL,
                API_URL: process.env.API_URL,
            },
            env_staging: {
                NODE_ENV: 'staging',
                PORT: 5001,
                FRONTEND_URL: process.env.FRONTEND_URL,
                API_URL: process.env.API_URL,
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
