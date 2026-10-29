const mysql = require('mysql2');
const configs = require('./dbConfigs');

const pools = {};

for (const [key, config] of Object.entries(configs)) {
  pools[key] = mysql.createPool(config);
}

module.exports = pools;