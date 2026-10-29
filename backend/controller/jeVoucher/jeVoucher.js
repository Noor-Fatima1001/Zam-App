const db = require('../../utils/db');


const { parseInvoiceExcel } = require('../../utils/invoiceExcelToJson.js');

exports.createJeVoucher = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callCreateJeVoucher (?)', [data], (err, result) => {
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




exports.uploadAndCreateJv = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ success: false, message: "No file uploaded." });
        }

        const filePath = req.file.path;
        const jsonData = parseInvoiceExcel(filePath,'bulkJV');

        const dataInsert = jsonData.dataInsert;
        const results = [];

        for (const invoice of dataInsert) {
            const data = JSON.stringify(invoice);
            console.log(data);

            try {
                const result = await new Promise((resolve, reject) => {
                    db.query('CALL callCreateJeVoucher (?)', [data], (err, result) => {
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





exports.reversalJeVoucher = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["reverseJv",data], (err, result) => {
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



exports.getJeVouchers = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getJeVouchers(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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


exports.getTrialBalance = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData)

    console.log(["trialBalance",headData,data,limit,offset,orderby]);

    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["trialBalance",headData,data,limit,offset,orderby],(err, result) => {
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



exports.getJournalLedger = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData)

    console.log(["journalLedger",headData,data,limit,offset,orderby]);

    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["journalLedger",headData,data,limit,offset,orderby],(err, result) => {
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

exports.getJeHeaderList = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getJeHeaderList(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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

exports.getJeEntriesList = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getJeEntriesList(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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



exports.getBalanceSheet = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData)


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["balanceSheet",headData,data,limit,offset,orderby],(err, result) => {
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



exports.getSupplierLedger = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData)


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getSupplierLedger",headData,data,limit,offset,orderby],(err, result) => {
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