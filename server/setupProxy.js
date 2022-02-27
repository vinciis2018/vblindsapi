import createProxyMiddleware from 'http-proxy-middleware';

module.exports = function(app) {
  app.use(
    '/events.mapbox.com/events/v2?access_token',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
    })
  );
};