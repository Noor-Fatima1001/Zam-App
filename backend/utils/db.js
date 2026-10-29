const mysql = require('mysql2');
require('dotenv').config();

const con = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection
con.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection error:", err);
    } else {
        console.log("DB connected");
        connection.release(); // Release the connection back to the pool
    }
});

module.exports = con;

