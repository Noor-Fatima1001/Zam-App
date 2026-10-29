const db = require('../../utils/db');

exports.createSupplier = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL suppliers (?)', [data], (err, result) => {
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


exports.updateSupplier = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL suppliers (?)', [data], (err, result) => {
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


exports.assignTaxToSupplier = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL assignTaxToSupplier (?)', [data], (err, result) => {
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


exports.updateTaxToSupplier = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL assignTaxToSupplier (?)', [data], (err, result) => {
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

exports.getSuppliersList = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getSuppliersList(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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


exports.getAssignedTaxToSupplierList = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getAssignedTaxToSupplierList(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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