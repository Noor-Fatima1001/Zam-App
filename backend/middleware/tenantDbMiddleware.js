const pools = require('../utils/dbPoolManager');
const db = require('../utils/db');

function getSubdomain(req) {
  const host = req.hostname;
  const parts = host.split('.');

  if (parts.length > 2) {
    return parts[0]; // e.g., demo.zamapplications.com → demo
  }

  // Fallback to custom header
  return req.headers['x-tenant-subdomain'] || null;
}

module.exports = (req, res, next) => {
  const subdomain = getSubdomain(req);
  console.log("Resolved subdomain:", subdomain);

  const pool = pools[subdomain];
  if (!pool) {
    console.error(`Invalid or missing subdomain: '${subdomain}' from host: ${req.hostname}`);
    return res.status(400).json({
      error: 'Invalid subdomain',
      subdomain: subdomain || 'none',
      hostname: req.hostname
    });
  }

  db.query = (...args) => pool.query(...args);
  next();
};