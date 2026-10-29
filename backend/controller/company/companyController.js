const db = require('../../utils/db');

exports.createCompany = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL createCompany (?)', [data], (err, result) => {
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

exports.updateCompany = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log(dataUpdate);

    db.query('CALL updateCompany (?,?,?)', [record_id,data,changed_by], (err, result) => {
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


exports.getAllCompany = (req, res) => {
    const {filters,limit,offset,orderby} = req.body
    const data = JSON.stringify(filters)
     
    db.query('CALL getAllCompany(?,?,?,?) ', [data, limit, offset,orderby], (err, result) => {
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

exports.assignUserToCompany = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL assignUserToCompany (?)', [data], (err, result) => {
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

exports.getCompanyToDept = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getCompanyToDept(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result[0][0]?.length === 0) {
            return res.send({ success: false, result:result[0][0].message });
        }else{

           
            return res.send({ success: true, result:result[0] });

        }
       
    });
};


exports.createFiscalYear = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL createFiscalYear (?)', [data], (err, result) => {
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


exports.getFiscalYears = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getFiscalYears(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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

exports.closingOfFiscalYears = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log(dataUpdate);

    db.query('CALL closingOfFiscalYears (?,?,?)', [record_id,data,changed_by], (err, result) => {
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


exports.getFiscalYearsMonths = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getFiscalYearsMonths(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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
exports.closingOfFiscalYearMonth = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log(dataUpdate);

    db.query('CALL closingOfFiscalYearMonth (?,?,?)', [record_id,data,changed_by], (err, result) => {
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


exports.assignInterCompnayGl = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL assignGlInterCompany (?)', [data], (err, result) => {
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


exports.updateInterCompnayGl = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL assignGlInterCompany (?)', [data], (err, result) => {
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



exports.getInterCompanyGl = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = '{}';


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getInterCompanyGl",headData,data,limit,offset,orderby],(err, result) => {
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
