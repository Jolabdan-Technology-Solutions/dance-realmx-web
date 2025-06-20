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
