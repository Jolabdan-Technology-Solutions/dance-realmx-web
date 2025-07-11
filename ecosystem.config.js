module.exports = {
  apps: [
    {
      name: 'dance-realmx-api',
      script: 'dist/main.js',
      instances: 1, // or 2 for two instances
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
    },
  ],
};
