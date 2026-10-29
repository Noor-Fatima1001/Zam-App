const mysql = require('mysql2/promise');
const dbConfigs = require('./dbConfigs');

const connectionStore = new Map();

async function getConnection(subdomain) {
  if (!dbConfigs[subdomain]) throw new Error(`Unknown subdomain: ${subdomain}`);

  if (!connectionStore.has(subdomain)) {
    const conn = await mysql.createConnection(dbConfigs[subdomain]);
    connectionStore.set(subdomain, conn);
  }

  return connectionStore.get(subdomain);
}

let db = null;

function setDB(connection) {
  db = connection;
}

function getDB() {
  return db;
}

module.exports = { getConnection, setDB, getDB };
