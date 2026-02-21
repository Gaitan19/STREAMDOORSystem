const { createProxyMiddleware } = require('http-proxy-middleware');
const { env } = require('process');

const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
  env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:44447';

const context = [
  "/api",
  "/swagger"
];

const onError = (err, req, resp, target) => {
    console.error(`${err.message}`);
}

module.exports = function (app) {
  const appProxy = createProxyMiddleware(context, {
    target: target,
    // Handle errors to prevent ECONNRESET during certificate issue
    onError: onError,
    secure: false,
    // Required for virtual hosts
    changeOrigin: true,
    // Enable cookies/credentials for JWT authentication
    onProxyReq: (proxyReq, req, res) => {
      // Preserve cookies
      if (req.headers.cookie) {
        proxyReq.setHeader('cookie', req.headers.cookie);
      }
    }
  });

  app.use(appProxy);
};
