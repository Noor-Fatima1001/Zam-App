const db = require('../../utils/db');

exports.createDepartment = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL createDepartment (?)', [data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, result:result[0][0].message });

        }
       
    });
}

exports.updateDepartment = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log(dataUpdate);

    db.query('CALL updateDepartment (?,?,?)', [record_id,data,changed_by], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, result:result[0][0].message });

        }
       
    });
}


exports.getAllDepartment = (req, res) => {
    const {filters,limit,offset,orderby} = req.body
    const data = JSON.stringify(filters)
     
    db.query('CALL getAllDept(?,?,?,?) ', [data, limit, offset,orderby], (err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result.length > 0) {
            return res.send({ success: true, data: result[0] });
        } else {
            return res.send({ success: false, message: 'No data found' });
        }
    });
}
exports.assignDeptToCom = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL assignDeptToCom (?)', [data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, result:result[0][0].message });

        }
       
    });
}


exports.assignDeptToUsers = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL assignDeptToUsers (?)', [data], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, result:result[0][0].message });

        }
       
    });
}



exports.updateDeptToCom = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log(dataUpdate);

    db.query('CALL updateDeptToCom (?,?,?)', [record_id,data,changed_by], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{
       
            
            return res.send({ success: true, result:result[0][0].message });

        }
       
    });
}
