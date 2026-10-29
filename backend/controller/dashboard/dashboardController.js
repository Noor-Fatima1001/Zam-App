const db = require('../../utils/db');



exports.dailySales = (req, res) => {
    const {headerData,filters, limit, offset,orderby} = req.body
    const data = JSON.stringify(filters)
    const headData = JSON.stringify(headerData);


    db.query('CALL getGeneraicData(?,?,?,?,?,?) ', ["dailySales",headData,data,limit,offset,orderby],(err, result) => {
        if (err) {
            return res.send({ err });
        }
        if (result[0][0]?.length === 0) {
            return res.send({ success: false, data:result[0][0].message });
        }else{



             // Ensure result[0] exists and has data
            if (!result || !result[0] || result[0].length === 0) {
                return res.send({ success: false, data: "No records found." });
            }

            // Convert stringified JSON inside "sub_data" into a real object
            const cleanedResult = result[0].map(row => {
                if (row.sub_data) {
                    try {
                        row.sub_data = JSON.parse(row.sub_data); // Parse the string into JSON
                    } catch (error) {
                        console.error("Error parsing sub_data:", error);
                    }
                }
                return row;
            });

            return res.send({ success: true, data: cleanedResult });

        }
       
    });
};


