const express = require('express');
const cors = require('cors');
const tenantDbMiddleware = require('./middleware/tenantDbMiddleware');
require('dotenv').config();
const userRoutes = require('./Routes/userRoutes');
const moduleRoutes = require('./Routes/moduleRoutes');
const companyRoutes = require('./Routes/companyRoutes');
const departmentRoutes = require('./Routes/departmentRoutes');
const coa = require('./Routes/coaRoutes');
const jeVoucher = require('./Routes/jeVoucherRoutes');
const tax = require('./Routes/taxRoutes');
const suppliers = require('./Routes/supplierRoutes');
const supplierInvoice = require('./Routes/supplierInvoiceRoutes');
const units = require('./Routes/unitsRoutes');
const products = require('./Routes/productRoutes');
const dashboard = require('./Routes/dashboardRoutes');
const bank = require('./Routes/bankRoutes');
const payments = require('./Routes/paymentsRoutes');

const fs = require('fs');
const path = require('path');



const app = express();
const root = process.env.ROOT_FOLDER;
const port = process.env.PORT;
const hostname = process.env.HOST_NAME;

// CORS Configuration
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization','X-Tenant-Subdomain'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight

// Middleware
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

app.set('trust proxy', true);
app.use(tenantDbMiddleware);


// Routes
app.use(`${root}`, userRoutes);
app.use(`${root}`, moduleRoutes);
app.use(`${root}`, companyRoutes);
app.use(`${root}`, departmentRoutes);
app.use(`${root}`, coa);
app.use(`${root}`, jeVoucher);
app.use(`${root}`, tax);
app.use(`${root}`, suppliers);
app.use(`${root}`, supplierInvoice);
app.use(`${root}`, units);
app.use(`${root}`, products);
app.use(`${root}`, dashboard);
app.use(`${root}`, bank);
app.use(`${root}`, payments);






const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Create a log file
const logFile = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });

// Override console methods
console.log = function (...args) {
    logFile.write(`[LOG ${new Date().toISOString()}] ${args.join(' ')}\n`);
    process.stdout.write(`[LOG] ${args.join(' ')}\n`);
};

console.error = function (...args) {
    logFile.write(`[ERROR ${new Date().toISOString()}] ${args.join(' ')}\n`);
    process.stderr.write(`[ERROR] ${args.join(' ')}\n`);
};

// Test log
console.log('=== Logging initialized ===');




// Start Server
app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
