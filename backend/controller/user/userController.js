const db = require('../../utils/db');
const jwt = require('jsonwebtoken');
const secretKey = 'mySuperSecretKey123!';


const { getApiQuad } = require('../../utils/getsalesApi');





// const fetch = require('node-fetch');

exports.login = (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    db.query('CALL login (?,?)', [username, password], (err, result) => {
        if(err){
            return res.send({sucess: false, err});
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{
            const user = result[0][0];

            const token = jwt.sign({ username: result[0][0].user_name }, secretKey, { expiresIn: '5h' });
            return res.send({ success: true, token, 
                userId: user.id,
                userFirstName: user.first_name,
                userLastName: user.last_name,
                userUserName: user.user_name,
                userEmail: user.email,
                userPassword: user.password,
                userGender: user.gender,
                userStatus: user.status,
                userFirstLogin: user.first_login});

        }
       
    });
}

exports.createUser = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
    console.log(data);
    db.query('CALL userRegister (?)', [data], (err, result) => {
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{

            return res.send({ success: true, result:result[0][0].message });

        }
       
    });
};
exports.getAllUsers = (req, res) => {
    db.query('CALL userList() ', (err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result.length > 0) {
            return res.send({ success: true, data: result[0] });
        } else {
            return res.send({ success: false, message: 'No data found' });
        }
    });
};

exports.updateUser = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)

    console.log(data);

    db.query('CALL updateUser(?,?,?)',[record_id, data,changed_by], (err, result)=> {
        if(err){
            return res.send({err});
        }

        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{

           
            return res.send({ success: true, result:result[0][0].message });

        }
       

    });

};

exports.getSingleUser = (req, res) => {
    const {id} = req.body
    db.query('CALL getSingleUser(?) ', [id],(err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{

           
            return res.send({ success: true, result:result[0] });

        }
       
    });
};


exports.getUserFilters = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getAllUsers(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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
exports.home = (req, res) => {
    
    return res.send({ success: true, message: 'App is running' });
   
};


exports.getUserToCompany = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getUserToCompany(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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

exports.getUserToDept = (req, res) => {
    const {filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)

    console.log([data,limit,offset,orderby]);

    db.query('CALL getUserToDept(?,?,?,?) ', [data,limit,offset,orderby],(err, result) => {
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


exports.updateUserToDept = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)

    console.log(data);

    db.query('CALL updateUserToDept(?,?,?)',[record_id, data,changed_by], (err, result)=> {
        if(err){
            return res.send({err});
        }

        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{

           
            return res.send({ success: true, result:result[0][0].message });

        }
       

    });

};

exports.updateUserToCompany = (req, res) => {
    const {record_id,dataUpdate,changed_by  } = req.body;
    const data = JSON.stringify(dataUpdate)

    console.log(data);

    db.query('CALL updateUserToCompany(?,?,?)',[record_id, data,changed_by], (err, result)=> {
        if(err){
            return res.send({err});
        }

        if (result[0][0].msgType == "error") {
            return res.send({ success: false, result:result[0][0].message });
        }else{

           
            return res.send({ success: true, result:result[0][0].message });

        }
       

    });

};

exports.getSalesData = (req, res) => {
    const { site, startDate, endDate } = req.body;
    console.log({ site, startDate, endDate });

    if (!site || !startDate || !endDate) {
        return res.send({ success: false, message: 'Site, startDate, and endDate are required' });
    }

    db.query('SELECT * FROM company_pos_communication WHERE company_id = ?', [site], async (err, response) => {
        if (err) {
            console.error('Error:', err);
            return res.send({ success: false, message: 'Database error' });
        }

        if (!response.length) {
            return res.send({ success: false, message: 'No site configuration found' });
        }

        const { site: siteName, brand_id: brandId, password, site_id: siteId, user } = response[0];
        console.log(siteName);

        try {
            const rawData = await getApiQuad(brandId, password, siteId, user, startDate, endDate);

            if (rawData && rawData.length > 0) {
                const formattedData = rawData.map(item => ({
                    company_name: site,
                    bill_header_id: item.BillHeaderID,
                    check_item_id: item.CheckItemID,
                    location_name: item.LocationName,
                    covers: item.Covers,
                    bill_total: item.BillTotal,
                    customer_table: item.CustomerTable,
                    session_name: item.SessionName,
                    bill_waiter: item.BillWaiter,
                    description: item.Description,
                    class_name: item.ClassName,
                    category_name: item.CategoryName,
                    plu_code: item.PLUCode,
                    created_on: item.CreatedOn,
                    quantity: item.Quantity,
                    menu_price: item.MenuPrice,
                    items_total: item.ItemsTotal,
                    net_sales: item.ItemsNet,
                    revenue_centre_name: item.RevenueCentreName,
                    api_key: item.Key
                }));

                return res.send({ success: true, data: formattedData });
            } else {
                return res.send({ success: false, message: 'No data found' });
            }
        } catch (apiErr) {
            console.error('API Error:', apiErr);
            return res.send({ success: false, message: 'Failed to fetch sales data' });
        }
    });
};


exports.home = (req, res) => {
    
    return res.send({ success: true, message: 'App is running' });
   
};





exports.postSalesData = (req, res) => {
    const {dataInsert} = req.body
    const data = JSON.stringify(dataInsert)
     
 
    console.log(dataInsert);
    db.query('CALL callReversalDeleteCancel (?,?)', ["salesPost",data], (err, result) => {
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
