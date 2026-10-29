const { getConnection, setDB } = require('../utils/dbRouter');

function extractSubdomain(req) {
  const forwardedHost = req.headers['x-tenant-subdomain'];
  if (forwardedHost) return forwardedHost;

  const host = req.headers.host?.split(':')[0]; // remove port
  const parts = host.split('.');
  if (parts.length >= 3) return parts[0]; // e.g., demo.zamapplications.com

  return null;
}

async function dbMiddleware(req, res, next) {
  const subdomain = extractSubdomain(req);

  if (!subdomain) {
    console.error('Subdomain not found in request');
    return res.status(400).json({ error: 'Subdomain not found' });
  }

  try {
    req.db = await getConnection(subdomain);
    next();
  } catch (err) {
    console.error(`DB middleware error for subdomain "${subdomain}":`, err.message);
    res.status(500).json({ error: 'Database connection failed' });
  }
}


module.exports = dbMiddleware;
