module.exports = {
  apps: [
    {
      name: 'dance-realmx-web',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --host',
      env: {
        NODE_ENV: 'development',
        VITE_API_URL: process.env.VITE_API_URL,
        VITE_FRONTEND_URL: process.env.VITE_FRONTEND_URL,
      },
     }
  ],
};
