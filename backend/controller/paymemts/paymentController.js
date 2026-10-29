const db = require('../../utils/db');



exports.getUnpaidInvoices = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["openInvoices",headData,data,limit,offset,orderby],(err, result) => {
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

exports.createPayment = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["createPayment",data], (err, result) => {
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


exports.paymentReversal = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["paymentReversal",data], (err, result) => {
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



exports.paymentHeadList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["paymentHeadList",headData,data,limit,offset,orderby],(err, result) => {
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

exports.paymentEnteries = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["paymentEnteries",headData,data,limit,offset,orderby],(err, result) => {
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


exports.paymentEnteriesDirectGl = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["paymentEnteriesDirectGl",headData,data,limit,offset,orderby],(err, result) => {
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





