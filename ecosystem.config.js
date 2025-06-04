"use strict";
exports.__esModule = true;
// ecosystem.config.ts
// Instead of importing, just export an object
module.exports = {
    apps: [
        {
            name: 'dance-realmx-api',
            script: 'dist/src/main.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 5001,
                FRONTEND_URL: 'https://livetestdomain.com',
                API_URL: 'https://api.livetestdomain.com'
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
