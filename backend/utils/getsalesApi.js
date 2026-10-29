
const axios = require('axios');
const moment = require('moment');

function getApiQuad(Brandid,Password,siteid,user, startDate, endDate) {
    
    // Format dates
    // const start_date = moment(startDate).format('DD MMM YYYY').toLowerCase();
    // const end_date = moment(endDate).format('DD MMM YYYY').toLowerCase();


// let Brandid, Password, siteid, user;



    // Brandid = '702';
    // Password = '15a8d290-2e80-40f8-9433-1b855472b55f';
    // siteid = '1089';
    // user = 'Rowleys';






    // API URL
    const url = `https://customerapi.quadranet.co.uk/SQLAPI/api/masterdata_items?Brandid=${Brandid}&Password=${Password}&siteid=${siteid}&User=${user}&Datefrom=${startDate}&Dateto=${endDate}`;

    // Fetch data from API
    return axios.get(url)
        .then(response => response.data)
        .catch(error => {
            console.error('API request failed:', error);
            throw error;
        });
}

module.exports = { getApiQuad };
