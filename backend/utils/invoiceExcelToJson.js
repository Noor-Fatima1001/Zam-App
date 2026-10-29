// const XLSX = require('xlsx');

// function convertExcelDate(serial) {
//     const utc_days = Math.floor(serial - 25569);
//     const utc_value = utc_days * 86400; // seconds
//     const date_info = new Date(utc_value * 1000);
//     return date_info.toISOString().split('T')[0]; // returns "YYYY-MM-DD"
// }

// const REQUIRED_COLUMNS = [
//     'posting_date', 'company_id', 'supplier_id', 'external_ref',
//     'header_description', 'source', 'source_id', 'invoice_total',
//     'invoice_tax', 'status', 'created_by', 'short_access',
//     'entry_description', 'entry_quantity', 'entry_unit_price',
//     'entry_tax_id', 'entry_tax_value', 'entry_tax_amount',
//     'entry_total_price', 'entry_gl_id'
// ];

// function validateColumns(columns) {
//     const missing = REQUIRED_COLUMNS.filter(col => !columns.includes(col));
//     return missing;
// }

// function parseInvoiceExcel(filePath) {
//     const workbook = XLSX.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];
//     const rawData = XLSX.utils.sheet_to_json(worksheet);

//     if (rawData.length === 0) {
//         throw new Error('Uploaded Excel file is empty.');
//     }

//     // Step 1: Normalize keys (column headers) for all rows
//     const cleanedData = rawData.map(row => {
//         const cleanedRow = {};
//         for (const key in row) {
//             cleanedRow[key.trim()] = row[key];
//         }
//         return cleanedRow;
//     });

//     // Step 2: Validate using cleaned column headers
//     const uploadedColumns = Object.keys(cleanedData[0]);
//     const missingColumns = validateColumns(uploadedColumns);
//     if (missingColumns.length > 0) {
//         throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
//     }

//     const groupedInvoices = {};

//     // Step 3: Group and transform
//     cleanedData.forEach(row => {
//         const externalRef = row['external_ref'];

//         if (!groupedInvoices[externalRef]) {
//             groupedInvoices[externalRef] = {
//                 header: {
//                     posting_date: convertExcelDate(row['posting_date']),
//                     company_id: row['company_id'],
//                     supplier_id: row['supplier_id'],
//                     external_ref: row['external_ref'],
//                     header_description: row['header_description'],
//                     source: row['source'],
//                     source_id: row['source_id'],
//                     invoice_total: row['invoice_total'],
//                     invoice_tax: row['invoice_tax'],
//                     status: row['status'],
//                     created_by: row['created_by'],
//                     header_id: row['header_id'] || "",
//                     short_access: row['short_access']
//                 },
//                 entries: []
//             };
//         }

//         groupedInvoices[externalRef].entries.push({
//             record_id: row['record_id'] || "",
//             description: row['entry_description'],
//             quantity: row['entry_quantity'],
//             unit_price: row['entry_unit_price'],
//             tax_id: row['entry_tax_id'],
//             tax_value: row['entry_tax_value'],
//             tax_amount: row['entry_tax_amount'],
//             total_price: row['entry_total_price'],
//             gl_id: row['entry_gl_id']
//         });
//     });

//     return {
//         dataInsert: Object.values(groupedInvoices)
//     };
// }

// module.exports = { parseInvoiceExcel };

const XLSX = require('xlsx');

function convertExcelDate(serial) {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400; // seconds
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0]; // returns "YYYY-MM-DD"
}

// Required columns for different types
const REQUIRED_COLUMNS = {
    bulkInvoice: [
        'posting_date', 'company_id', 'supplier_id', 'external_ref',
        'header_description', 'source', 'source_id', 'invoice_total',
        'invoice_tax', 'status', 'created_by', 'short_access','record_id',
        'entry_description', 'entry_quantity', 'entry_unit_price',
        'entry_tax_id', 'entry_tax_value', 'entry_tax_amount',
        'entry_total_price', 'entry_gl_id'
    ],
    bulkJV: [
        'posting_date', 'company_id', 'source', 'source_id',
        'header_description', 'created_by', 'status', 'gl_id',
        'description', 'debit', 'credit'
    ]
};

function validateColumns(columns, type) {
    const required = REQUIRED_COLUMNS[type] || [];
    return required.filter(col => !columns.includes(col));
}

function parseInvoiceExcel(filePath, type = 'bulkInvoice') {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
        throw new Error('Uploaded Excel file is empty.');
    }

    const cleanedData = rawData.map(row => {
        const cleanedRow = {};
        for (const key in row) {
            cleanedRow[key.trim()] = row[key];
        }
        return cleanedRow;
    });

    const uploadedColumns = Object.keys(cleanedData[0]);
    const missingColumns = validateColumns(uploadedColumns, type);
    if (missingColumns.length > 0) {
        throw new Error(`Missing required columns for ${type}: ${missingColumns.join(', ')}`);
    }

    if (type === 'bulkInvoice') {
        const groupedInvoices = {};

        cleanedData.forEach(row => {
            const externalRef = row['external_ref'];

            if (!groupedInvoices[externalRef]) {
                groupedInvoices[externalRef] = {
                    header: {
                        posting_date: convertExcelDate(row['posting_date']),
                        company_id: row['company_id'],
                        supplier_id: row['supplier_id'],
                        external_ref: row['external_ref'],
                        header_description: row['header_description'],
                        source: row['source'],
                        source_id: row['source_id'],
                        invoice_total: row['invoice_total'],
                        invoice_tax: row['invoice_tax'],
                        status: row['status'],
                        created_by: row['created_by'],
                        header_id: row['header_id'] !== undefined && row['header_id'] !== '' ? Number(row['header_id']) : null,
                        short_access: row['short_access']
                    },
                    entries: []
                };
            }

            groupedInvoices[externalRef].entries.push({
            
                record_id: row['record_id'] !== undefined && row['record_id'] !== '' ? Number(row['record_id']) : null,
                description: row['entry_description'],
                quantity: row['entry_quantity'],
                unit_price: row['entry_unit_price'],
                tax_id: row['entry_tax_id'],
                tax_value: row['entry_tax_value'],
                tax_amount: row['entry_tax_amount'],
                total_price: row['entry_total_price'],
                gl_id: row['entry_gl_id']
            });
        });

        return {
            dataInsert: Object.values(groupedInvoices)
        };

    } else if (type === 'bulkJV') {
        const groupedJVs = {};

        cleanedData.forEach(row => {
            const headerDesc = row['header_description'];

            if (!groupedJVs[headerDesc]) {
                groupedJVs[headerDesc] = {
                    header: {
                        posting_date: convertExcelDate(row['posting_date']),
                        company_id: row['company_id'],
                        source: row['source'],
                        source_id: row['source_id'],
                        header_description: row['header_description'],
                        created_by: row['created_by'],
                        status: row['status'],
                       header_id: row['header_id'] || ""
                    },
                    entries: []
                };
            }

            groupedJVs[headerDesc].entries.push({
                gl_id: row['gl_id'],
                description: row['description'],
                debit: row['debit'],
                credit: row['credit']
            });
        });

        return {
            dataInsert: Object.values(groupedJVs)
        };
    } else {
        throw new Error(`Unsupported import type: ${type}`);
    }
}

module.exports = { parseInvoiceExcel };
