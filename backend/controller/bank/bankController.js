const db = require('../../utils/db');

exports.createBank = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL bank (?)', [data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, data:result[0][0].message });

        }
       
    });
}


exports.updateBank = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL bank (?)', [data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, data:result[0][0].message });

        }
       
    });
}


exports.assignBankToCompany = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL assignBankToCompany (?)', [data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, data:result[0][0].message });

        }
       
    });
}


exports.updateBankToCompany = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL assignBankToCompany (?)', [data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, data:result[0][0].message });

        }
       
    });
}

exports.getBankList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["bankList",headData,data,limit,offset,orderby],(err, result) => {
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


exports.getAssignedBankToCompany = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getAssignedBankToCompany",headData,data,limit,offset,orderby],(err, result) => {
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

