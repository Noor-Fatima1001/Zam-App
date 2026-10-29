const db = require('../../utils/db');

require('dotenv').config();
const EmailSender = require('../../utils/EmailSender');

function getEmailSender() {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT smtp_host, smtp_port, smtp_user, smtp_password, from_email FROM email_config ORDER BY id DESC LIMIT 1',
      (err, results) => {
        if (err) {
          return reject('Error fetching email config: ' + err);
        }

        if (results.length === 0) {
          return reject('No email config found in DB');
        }

        const config = results[0];

        const emailSender = new EmailSender({
          host: config.smtp_host,
          port: parseInt(config.smtp_port),
          auth: {
            user: config.smtp_user,
            pass: config.smtp_password
          },
          from: config.from_email
        });

        console.log('EmailSender initialized from DB config');
        console.log(config);
        resolve(emailSender);
      }
    );
  });
}






// const emailSender = new EmailSender({
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT),
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS
//     },
//     from: process.env.FROM_EMAIL
// });


function formatDate(mysqlDate) {
    if (!mysqlDate) return '';
    
    // Convert to yyyy-mm-dd string format
    const dateStr = mysqlDate.toISOString().split('T')[0]; // "yyyy-mm-dd"
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
}



exports.createProductCategory = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL product_categories (?)', [data], (err, result) => {
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


exports.updateProductCategory = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL product_categories (?)', [data], (err, result) => {
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


exports.getProductCategoryList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getProductCategory",headData,data,limit,offset,orderby],(err, result) => {
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


exports.createProduct = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL product (?)', [data], (err, result) => {
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

exports.updateProduct = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL product (?)', [data], (err, result) => {
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


exports.getProductList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getProductList",headData,data,limit,offset,orderby],(err, result) => {
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





exports.creatProductToDept = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL assign_product_to_com_dept (?)', [data], (err, result) => {
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

exports.updateProductToDept = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL assign_product_to_com_dept (?)', [data], (err, result) => {
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


exports.getProductTODeptList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getProductToDeptList",headData,data,limit,offset,orderby],(err, result) => {
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


exports.getProductUnits = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["productUnits",headData,data,limit,offset,orderby],(err, result) => {
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


exports.getUserProductList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["userProductList",headData,data,limit,offset,orderby],(err, result) => {
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



exports.createStockOverview = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL stockOverview (?)', [data], (err, result) => {
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


exports.updateStockOverview = (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL stockOverview (?)', [data], (err, result) => {
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


exports.getStockOverview = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getStockOverview",headData,data,limit,offset,orderby],(err, result) => {
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




// exports.createOrder = (req, res) => {
//     const { dataInsert } = req.body
//     const data = JSON.stringify(dataInsert)
//     const emailstatus = '';
//     // console.log(dataInsert);
//     db.query('CALL callReversalDeleteCancel (?,?)', ["createOrder", data], (err, result) => {
//         if (err) {
//             return res.send({ sucess: false, err });
//         }
//         if (result[0][0].msgType == "error") {
//             return res.send({ success: false, data: result[0] });
//         } else {

//             console.log(result[0][0].headerId);
//             const order_id  = result[0][0].headerId;


//             const sql = `
//                     SELECT * FROM purchase_order_header
//                     WHERE id = ?
                    
//                     `;

//             db.query(sql, order_id, (err, result_order_status) => {
//                 if (err) {
//                   console.error("Database error in getUserOrderList:", err); 
//                 }

//                 if (result_order_status.length === 0) {
//                     console.log("no record found");
//                 } else {
//                     const order_status = result_order_status[0].status;

//                     console.log(order_status);
//                     if (order_status === 'sent') {

//                         const sql_order_enteries = `
//                                 SELECT
//                                 poe.purchase_order_id,
//                                 poe.comp_to_dept_id,
//                                 adtc.dept_id,
//                                 d.dept_code,
//                                 d.dept_name,
//                                 poe.product_id,
//                                 pm.product_code,
//                                 pm.product_name,
//                                 poe.unit_selected,
//                                 ump.description as unit_packaging,
//                                 ul.size,
//                                 umu.description as unit_name,
//                                 poe.qty,
//                                 poe.price,
//                                 poe.comments
                                
//                             FROM
//                                 purchase_order_enteries poe
//                             INNER JOIN assignDeptToCompany adtc ON
//                                 adtc.id = poe.comp_to_dept_id
//                             inner join departments d on d.id = adtc.dept_id
//                             inner join product_master pm on pm.id = poe.product_id
//                             inner join unit_list ul on ul.id = poe.unit_selected
//                             INNER JOIN unit_master ump on ump.id = ul.packaging_id
//                             INNER JOIN unit_master umu on umu.id = ul.unit_id
//                             WHERE
//                                 poe.purchase_order_id = ?`;


//                             db.query(sql_order_enteries, order_id, (err, result_order_enteries) => {
//                                 if (err) {
//                                 console.error("Database error in getUserOrderEnteries:", err); 
//                                 }

//                                 if (result_order_enteries.length === 0) {
//                                     console.log("no record found");
//                                 }else{


//                                     const productItems = result_order_enteries.map(row => {
//                                         const unitDisplay = `${row.unit_packaging}x${row.size}${row.unit_name}`;
//                                         return [
//                                             row.product_name,
//                                             unitDisplay,
//                                             row.qty.toString(),
//                                             row.comments || ''
//                                         ];
//                                     });

//                                      const emailData = {
//                                             templateName: 'order-confirmation',
//                                             to: 'zubair@rowleysrestaurants.com',
//                                             cc: 'mzubair.khan46@gmail.com',
//                                             subject: `Purchase Order #${order_id} - Rowleys Restaurant`,
//                                             templateData: {
//                                                 title: 'Purchase Order',
//                                                 subtitle: 'Please see below purchase order details',
//                                                 fields: {
//                                                     'Order Number': `#${order_id}`,
//                                                     'Customer Name': 'Rowleys Restaurants & Bar (DIFC) LTD', // pull dynamically if needed
//                                                     'Delivery Address': 'Central Park Tower Level P3',
//                                                     'Delivery Date': '3-5 business days'
//                                                 },
//                                                 products: {
//                                                     headers: ['Product Name', 'Unit', 'Quantity', 'Comments'],
//                                                     items: productItems
//                                                 },
//                                                 footerText: 'If you have any questions, please contact our support team. +971-xxxxxxx',
//                                                 companyName: 'Rowleys',
//                                                 year: new Date().getFullYear()
//                                             }
//                                         };

//                                         console.log(JSON.stringify(emailData, null, 2));

//                                         emailSender.sendDynamicEmail(emailData)
//                                                 .then(() => {
                                                    
//                                                     console.log("Email sent successfully");
//                                                     emailstatus = "Email sent successfully";
//                                                 })
//                                                 .catch(err => {
//                                                     console.error("Failed to send email:", err);
//                                                 });
//                                                      }

//                             });





//                     }

//                 }
//             });

            

//             return res.send({ success: true, data: result[0], emailStatus: emailstatus });












//         }

//     });
// }


exports.createOrder = async (req, res) => {
    const { dataInsert } = req.body;
    const data = JSON.stringify(dataInsert);
    let emailStatus = '';

    db.query('CALL callReversalDeleteCancel (?,?)', ["createOrder", data], async (err, result) => {
        if (err) return res.send({ success: false, err });

        if (result[0][0].msgType == "error") {
            return res.send({ success: false, data: result[0] });
        }

        const order_id = result[0][0].headerId;

        db.query(`SELECT
    poh.order_date,
    poh.delivery_date,
    poh.company_id,
    c.company_code,
    c.company_name,
    c.company_address,
    c.company_phone,
    poh.supplier_id,
    sl.supplier_code,
    sl.supplier_name,
    sl.supplier_address,
    sl.supplier_phone,
    sl.supplier_website,
    sl.supplier_order_communication,
    poh.status
FROM
    purchase_order_header poh inner JOIN companys c on c.id = poh.company_id
    INNER JOIN supplier_lists sl on sl.id = poh.supplier_id
WHERE
    poh.id = ?`, order_id, (err, result_order_status) => {
            if (err || result_order_status.length === 0) {
                return res.send({ success: true, data: result[0], emailStatus: 'Order not found or DB error' });
            }

            const order_status = result_order_status[0].status;
            const company_name = result_order_status[0].company_name;
            const company_address = result_order_status[0].company_address;
            const supplier_emails = result_order_status[0].supplier_order_communication;
            const order_date = result_order_status[0].order_date;
            const delivery_date = result_order_status[0].delivery_date;

            

            if (order_status === 'sent') {
                db.query(`
                    SELECT
                        poe.purchase_order_id, poe.comp_to_dept_id, adtc.dept_id, d.dept_code, d.dept_name,
                        poe.product_id, pm.product_code, pm.product_name, poe.unit_selected,
                        ump.description as unit_packaging, ul.size, umu.description as unit_name,
                        poe.qty, poe.price, poe.comments, adtc.person_contact, adtc.email_to
                    FROM purchase_order_enteries poe
                    INNER JOIN assignDeptToCompany adtc ON adtc.id = poe.comp_to_dept_id
                    INNER JOIN departments d ON d.id = adtc.dept_id
                    INNER JOIN product_master pm ON pm.id = poe.product_id
                    INNER JOIN unit_list ul ON ul.id = poe.unit_selected
                    INNER JOIN unit_master ump ON ump.id = ul.packaging_id
                    INNER JOIN unit_master umu ON umu.id = ul.unit_id
                    WHERE poe.purchase_order_id = ?
                `, order_id, async (err, result_order_enteries) => {
                    if (err || result_order_enteries.length === 0) {
                        return res.send({ success: true, data: result[0], emailStatus: 'No order items or DB error' });
                    }

                    const productItems = result_order_enteries.map(row => {
                        const unitDisplay = `${row.unit_packaging}x${row.size}${row.unit_name}`;
                        return [row.product_name, unitDisplay, row.qty.toString(), row.comments || ''];
                    });
                    const person_contact = result_order_enteries[0].person_contact;
                    const dept_email_cc = result_order_enteries[0].email_to;
                    const dept_name = result_order_enteries[0].dept_name;
                    
                    const info = {
                                    details: `Customer Name: ${company_name} <br> 
                                    Department Name: ${dept_name} <br> 
                                    Delivery Address : ${company_address} <br>
                                    Contact : ${person_contact} <br>  
                                    
                                    ` ,
                                    datedata: `
                                    Order Date: ${formatDate(order_date)} <br>
                                    Delivery Date: ${formatDate(delivery_date)} <br>
                                    
                                    `
                                };
                              

                    const emailData = {
                        templateName: 'order-confirmation',
                        to: `${supplier_emails}`,
                        cc: `${dept_email_cc}`,
                        subject: `Purchase Order #${order_id} - ${company_name}`,
                        templateData: {
                            title: 'Purchase Order',
                            subtitle: 'Please see below purchase order details',
                            fields: {
                                'Order Number': `#${order_id}`,
                                'Customer Info': `${info.details}`,
                                'Delivery Info': `${info.datedata}`
                            },
                            products: {
                                headers: ['Product Name', 'Unit', 'Quantity', 'Comments'],
                                items: productItems
                            },
                            footerText: 'If you have any questions, please contact our support team.',
                            companyName: 'Zam Applications',
                            year: new Date().getFullYear()
                        }
                    };

                    // try {
                    //     await emailSender.sendDynamicEmail(emailData);
                    //     emailStatus = "Email sent successfully";
                    // } catch (error) {
                    //     console.error("Failed to send email:", error);
                    //     emailStatus = "Failed to send email";
                    // }



                    let emailStatus = "";

                        try {
                        const emailSender = await getEmailSender();
                        await emailSender.sendDynamicEmail(emailData);
                        emailStatus = "Email sent successfully";
                        } catch (error) {
                        console.error("Failed to send email:", error);
                        emailStatus = "Failed to send email";
                        }

                    // ✅ Now send response after email is attempted
                    return res.send({ success: true, data: result[0], emailStatus });
                });
            } else {
                return res.send({ success: true, data: result[0], emailStatus: 'Order not sent' });
            }
        });
    });
};



exports.getUserOrderList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["userOrderList",headData,data,limit,offset,orderby],(err, result) => {
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


exports.getUserOrderListEnteries = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["userOrderListEnteries",headData,data,limit,offset,orderby],(err, result) => {
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





exports.orderEntryDelete = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["orderEntryDelete",data], (err, result) => {
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


exports.createItemLedger = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["createItemLedger",data], (err, result) => {
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


exports.getItemLedgerHead = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["itemLedgerHead",headData,data,limit,offset,orderby],(err, result) => {
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


exports.getItemLedgerEnteries = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["itemLedgerEnteries",headData,data,limit,offset,orderby],(err, result) => {
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



exports.itemLedgerEntryDelete = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["itemLedgerEntryDelete",data], (err, result) => {
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



exports.getOpenItemForDelivery = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["itemDeliveryBasedonOrder",headData,data,limit,offset,orderby],(err, result) => {
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


exports.itemPurchaseActivity = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["itemPurchaseActivity",headData,data,limit,offset,orderby],(err, result) => {
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


exports.createRecipe = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["createRecipe",data], (err, result) => {
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


exports.getProductChildItems = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["productChildItems",headData,data,limit,offset,orderby],(err, result) => {
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


exports.getRecipeDetails = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["recipe_details",headData,data,limit,offset,orderby],(err, result) => {
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


exports.getDeptRecipeList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["deptRecipeList",headData,data,limit,offset,orderby],(err, result) => {
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


exports.productInBatchRecipe = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["deptProductInBatchRecipe",headData,data,limit,offset,orderby],(err, result) => {
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

exports.getDeptProductForRecipeCreation = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = "{}";


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["DeptProductForRecipeCreation",headData,data,limit,offset,orderby],(err, result) => {
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



exports.productChildDelete = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["productChildDelete",data], (err, result) => {
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


exports.createInventoryAdjustment = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["createInventoryAdjustment",data], (err, result) => {
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



exports.InventoryAdjustmentDetailDelete = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["InventoryAdjustmentDetailDelete",data], (err, result) => {
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



exports.inventoryAdjustmentDelete = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["inventoryAdjustmentDelete",data], (err, result) => {
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



exports.itemAdjustmentHead = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["itemAdjustmentHead",headData,data,limit,offset,orderby],(err, result) => {
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


exports.itemAdjustmentDetails = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["itemAdjustmentDetails",headData,data,limit,offset,orderby],(err, result) => {
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


exports.getSalesPlu = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getSalesPlu",headData,data,limit,offset,orderby],(err, result) => {
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




exports.salesPluUpdate = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["salesPluUpdate",data], (err, result) => {
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





exports.creatLocation = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL stock_locations (?)', [data], (err, result) => {
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

exports.updateLocation= (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL stock_locations (?)', [data], (err, result) => {
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


exports.getLocationList = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getLocationList",headData,data,limit,offset,orderby],(err, result) => {
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



exports.assignLocationToDept = (req, res) => {
    const {dataInsert} = req.body
    // Add "op_type" property to dataInsert
dataInsert.op_type = "create";
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL assign_location_to_comp_dept (?)', [data], (err, result) => {
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

exports.updateAssignLocationToDept= (req, res) => {
    const {dataUpdate} = req.body
    dataUpdate.op_type = "update";
    const data = JSON.stringify(dataUpdate)
     
 
    console.log(dataUpdate);
    db.query('CALL assign_location_to_comp_dept (?)', [data], (err, result) => {
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



exports.getAssignLocationToDept = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["getAssignLocationToDept",headData,data,limit,offset,orderby],(err, result) => {
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



exports.createStockList = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["createStockList",data], (err, result) => {
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



exports.adminClosingStockHeader = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["adminClosingStockHeader",headData,data,limit,offset,orderby],(err, result) => {
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



exports.adminClosingStockEnteries = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["adminClosingStockEnteries",headData,data,limit,offset,orderby],(err, result) => {
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



exports.deptClosingStockHeader = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["deptClosingStockHeader",headData,data,limit,offset,orderby],(err, result) => {
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



exports.deptClosingStockEnteries = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["deptClosingStockEnteries",headData,data,limit,offset,orderby],(err, result) => {
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


exports.saveClosingStock = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["saveClosingStock",data], (err, result) => {
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


exports.lockForVariance = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["lockForVariance",data], (err, result) => {
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

exports.unlockForVariance = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["unlockForVariance",data], (err, result) => {
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


exports.itemCostMovment = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["itemCostMovment",headData,data,limit,offset,orderby],(err, result) => {
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
