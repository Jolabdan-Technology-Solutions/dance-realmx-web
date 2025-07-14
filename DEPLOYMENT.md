# Deployment Guide

This guide will help you resolve the module loading errors and deploy the DanceRealmX application properly.

## Common Issues

### 1. Module Loading Error

```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"
```

This error occurs when the server doesn't serve JavaScript files with the correct MIME type.

## Solutions

### Option 1: Using Vite Preview (Recommended for Development)

1. Build the application:

```bash
npm run build
```

2. Start the preview server:

```bash
npm run preview
```

The application will be available at `http://localhost:4173`

### Option 2: Using Serve (Recommended for Production)

1. Build the application:

```bash
npm run build
```

2. Start the serve server:

```bash
npm run serve
```

The application will be available at `http://localhost:4173`

### Option 3: Using PM2 with Serve

1. Build the application:

```bash
npm run build
```

2. Start with PM2:

```bash
pm2 start ecosystem.config.cjs
```

### Option 4: Nginx Configuration

If you're using Nginx, use the provided `nginx.conf` file which includes:

- Proper MIME type handling for JavaScript modules
- Static asset caching
- Client-side routing support

### Option 5: Apache Configuration

If you're using Apache, copy the `.htaccess` file to your web root directory.

## Environment Variables

Make sure to set the following environment variables:

```bash
VITE_API_URL=https://your-api-domain.com
VITE_FRONTEND_URL=https://your-frontend-domain.com
```

## Troubleshooting

### If modules still don't load:

1. Check that your server is serving `.js` files with `Content-Type: application/javascript`
2. Ensure the `dist` directory contains all built files
3. Verify that the base URL in your Vite config matches your deployment URL
4. Clear browser cache and try again

### For development:

Use `npm run dev` which will start the Vite dev server with proper module handling.

## Build Process

The build process creates optimized files in the `dist` directory:

- `index.html` - Main HTML file
- `assets/` - JavaScript modules and CSS files
- Other static assets

## Security Considerations

- The `.htaccess` file includes security headers
- Static assets are cached appropriately
- Client-side routing is handled properly
