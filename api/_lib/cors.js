// Shared CORS headers — applied to every response
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Wrap any handler with CORS pre-flight support.
 * Usage: export default withCors((req, res) => { ... });
 */
export function withCors(handler) {
  return (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return handler(req, res);
  };
}
