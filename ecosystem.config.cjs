module.exports = {
  apps: [
    {
      name: "dance-realmx-web",
      script: "node_modules/serve/bin/serve.js",
      args: "-s dist -l 4173",
      env: {
        NODE_ENV: "production",
        VITE_API_URL: process.env.VITE_API_URL,
        VITE_FRONTEND_URL: process.env.VITE_FRONTEND_URL,
      },
    },
  ],
};
