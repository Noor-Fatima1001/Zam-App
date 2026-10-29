const db = require('../../utils/db');



function transformSidebarData(data) {
    const sidebar = [];

    // Group modules and their submodules
    const moduleMap = {};
    data.result.forEach((item) => {
        const moduleId = item.module_id;

        // If the module is not already in the map, add it
        if (!moduleMap[moduleId]) {
            moduleMap[moduleId] = {
                header: item.module_name,
                items: []
            };
        }

        // Handle submodules (if present)
        if (item.sub_module_id) {
            const subModuleItem = {
                text: item.module_text,
                available: true,
                icon: item.header_icon || "",
                link: item.header_link || "",
                submenu: []
            };

            // Find or create the main module item
            const existingItem = moduleMap[moduleId].items.find(
                (el) => el.text === item.module_text
            );

            const submenuEntry = {
                
                text: item.sub_module_name,
                available: true,
                link: '/'+item.sub_module_link
            };

            if (existingItem) {
                existingItem.submenu.push(submenuEntry);
            } else {
                subModuleItem.submenu.push(submenuEntry);
                moduleMap[moduleId].items.push(subModuleItem);
            }
        }
    });

    // Convert the module map to an array
    Object.values(moduleMap).forEach((module) => {
        sidebar.push(module);
    });

    return sidebar;
}


exports.createmodule = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL createModule (?)', [data], (err, result) => {
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

exports.updateModule = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log(dataUpdate);

    db.query('CALL updateModule (?,?,?)', [record_id,data,changed_by], (err, result) => {
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


exports.getAllModules = (req, res) => {
    const {filters,limit,offset,orderBy} = req.body
    const data = JSON.stringify(filters)
     
    db.query('CALL getAllmodule(?,?,?,?) ', [data, limit, offset,orderBy], (err, result) => {
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

exports.accessUserModules = (req, res) => {
    const {userId,filters,limit,offset,orderby } = req.body;
    const data = JSON.stringify(filters)

    db.query('CALL accessUserModules (?,?,?,?,?)', [userId,data,limit,offset,orderby], (err, result) => {
        console.log(result);
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0]?.length === 0) {
            return res.send({ success: false });
        }else{
       
           
            return res.send({ success: true, result:result[0]});

        }
       
    });
}
exports.sideBar = (req, res) => {
    const {userId,filters,limit,offset,orderby } = req.body;
    const data = JSON.stringify(filters)

    db.query('CALL accessUserModules (?,?,?,?,?)', [userId,data,limit,offset,orderby], (err, result) => {
        console.log(result);
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0]?.length === 0) {
            return res.send({ success: false });
        }else{
       
            const sidebar = transformSidebarData({ success: true, result:result[0]});
           
            return res.send({ success: true, result:sidebar});

        }
       
    });
}
exports.createSubModule = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL createSubModule(?) ', [data],(err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{

           
            return res.send({ success: true ,result:result[0][0].message});

        }
       
    });
};


exports.updateSubModule = (req, res) => {
    const {record_id,dataUpdate, changed_by} = req.body
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL updateSubModule(?,?,?) ', [record_id,data,changed_by] ,(err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{

           
            return res.send({ success: true ,result:result[0][0].message});

        }
       
    });
};


exports.getSubModuleList = (req, res) => {
    const {filters,limit,offset,orderby} = req.body
    const data = JSON.stringify(filters)
     
 
    
    db.query('CALL getAllSubmodule(?,?,?,?) ', [data, limit, offset,orderby],(err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result[0][0]?.length === 0) {
            return res.send({ success: false, result:result[0] });
        }else{

           
            return res.send({ success: true, result:result[0] });

        }
       
    });
};


exports.assignSubModule = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL assignSubModule(?) ', [data],(err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{

           
            return res.send({ success: true ,result:result[0][0].message});

        }
       
    });
};

exports.updateUserModule = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)
 
    console.log([record_id,data,changed_by]);

    db.query('CALL updateUserModule (?,?,?)', [record_id,data,changed_by], (err, result) => {
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