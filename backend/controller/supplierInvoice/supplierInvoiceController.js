const multer = require('multer');
const fs = require('fs');
const { parseInvoiceExcel } = require('../../utils/invoiceExcelToJson.js');


const db = require('../../utils/db');




exports.createInvoice = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["createInvoice",data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data:result[0] });
        }else{
       
            
            return res.send({ success: true, data:result[0] });

        }
       
    });

    
}



exports.bulkCreateInvoices = async (req, res) => {
    const { dataInsert } = req.body; // This should be an array of invoices

    const results = [];
    for (const invoice of dataInsert) {
        const data = JSON.stringify(invoice);
       
        try {
            const result = await new Promise((resolve, reject) => {
                db.query('CALL callReversalDeleteCancel (?, ?)', ["createInvoice", data], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
            results.push({ success: true, data: result[0] });
        } catch (error) {
            results.push({ success: false, error });
        }
    }

    res.send({ success: true, results });
};





exports.uploadAndCreateInvoices = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ success: false, message: "No file uploaded." });
        }

        const filePath = req.file.path;
        const jsonData = parseInvoiceExcel(filePath,'bulkInvoice');

        const dataInsert = jsonData.dataInsert;
        const results = [];

        for (const invoice of dataInsert) {
            const data = JSON.stringify(invoice);
            console.log(data);

            try {
                const result = await new Promise((resolve, reject) => {
                    db.query('CALL callReversalDeleteCancel (?, ?)', ["createInvoice", data], (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
                results.push({ success: true, data: result[0] });
            } catch (error) {
                results.push({ success: false, error: error.message });
            }
        }

        res.send({ success: true, results });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: "Error processing invoice upload.", error: err.message });
    }
};




exports.getInvoiceHeaderList = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getInvoiceHeaderList(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result[0][0]?.length === 0) {
            return res.send({ success: false, data:result[0][0].message });
        }else{

           
            return res.send({ success: true, data:result[0] });

        }
       
    });
};

exports.getInvoiceEnteriesList = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getInvoiceEnteriesList(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result[0][0]?.length === 0) {
            return res.send({ success: false, data:result[0][0].message });
        }else{

           
            return res.send({ success: true, data:result[0] });

        }
       
    });
};


exports.supInvEntryDelete = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["supInvEntryDelete",data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data:result[0] });
        }else{
       
            
            return res.send({ success: true, data:result[0] });

        }
       
    });
}



exports.supInvDelete = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["supInvDelete",data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data:result[0] });
        }else{
       
            
            return res.send({ success: true, data:result[0] });

        }
       
    });
}

exports.invoiceReversal = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["supInvReversal",data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data:result[0] });
        }else{
       
            
            return res.send({ success: true, data:result[0] });

        }
       
    });
}

