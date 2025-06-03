module.exports = {
  apps: [
    {
      name: "vite-preview",
      script: "node_modules/vite/bin/vite.js",
      args: "preview --host 0.0.0.0",
      env: {
        NODE_ENV: "production",
        PORT: 5173
      }
    }
  ]
};

