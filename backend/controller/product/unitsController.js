const db = require('../../utils/db');

exports.createUnitMaster = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL unit_master (?)', [data], (err, result) => {
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


exports.updateUnitMaster = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL unit_master (?)', [data], (err, result) => {
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


exports.getUnitMaster = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getUnitMaster",headData,data,limit,offset,orderby],(err, result) => {
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


exports.createUnitList = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL unit_list (?)', [data], (err, result) => {
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


exports.updateUnitList = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL unit_list (?)', [data], (err, result) => {
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


exports.getUnitList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getUnitList",headData,data,limit,offset,orderby],(err, result) => {
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




exports.createConversion = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL conversion_list (?)', [data], (err, result) => {
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


exports.updateConversion = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL conversion_list (?)', [data], (err, result) => {
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


exports.getConversionList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = '{}';


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getConversionList",headData,data,limit,offset,orderby],(err, result) => {
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



exports.getConverisonQtyPrice = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL getConverisonQtyPrice (?)', [data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, data:result[0] });

        }
       
    });
}
