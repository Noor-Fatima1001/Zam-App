const db = require('../../utils/db');

exports.createCoaMainHead = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL createCoaMainHead (?)', [data], (err, result) => {
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

exports.updateCoaMainHead = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log(dataUpdate);

    db.query('CALL updateCoaMainHead (?,?,?)', [record_id,data,changed_by], (err, result) => {
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


exports.getCoaMainHead = (req, res) => {
    const {filters,limit,offset,orderby} = req.body
    const data = JSON.stringify(filters)
     
    db.query('CALL getCoaMainHead(?,?,?,?) ', [data, limit, offset,orderby], (err, result) => {
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


exports.createCoaSubHead = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL createCoaSubHead (?)', [data], (err, result) => {
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

exports.updateCoaSubHead = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log(dataUpdate);

    db.query('CALL updateCoaSubHead (?,?,?)', [record_id,data,changed_by], (err, result) => {
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


exports.getCoaSubHead = (req, res) => {
    const {filters,limit,offset,orderby} = req.body
    const data = JSON.stringify(filters)
     
    db.query('CALL getCoaSubHead(?,?,?,?) ', [data, limit, offset,orderby], (err, result) => {
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

exports.createCoa = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL createCoa (?)', [data], (err, result) => {
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
exports.getCoa = (req, res) => {
    const {filters,limit,offset,orderby} = req.body
    const data = JSON.stringify(filters)
     
    db.query('CALL getCoa(?,?,?,?) ', [data, limit, offset,orderby], (err, result) => {
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


exports.updateCoa = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log(dataUpdate);

    db.query('CALL updateCoa (?,?,?)', [record_id,data,changed_by], (err, result) => {
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
