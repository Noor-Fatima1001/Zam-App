const db = require('../../utils/db');

exports.createTax = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL createTax (?)', [data], (err, result) => {
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


exports.updateTax = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL createTax (?)', [data], (err, result) => {
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


exports.getTaxList = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getTaxList(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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