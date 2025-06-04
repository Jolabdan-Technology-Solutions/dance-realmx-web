// ecosystem.config.ts
// Instead of importing, just export an object
export default {
  apps: [
    {
      name: 'nest-app',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
    },
  ],
};

