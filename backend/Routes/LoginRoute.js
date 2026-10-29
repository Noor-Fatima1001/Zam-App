// import express from 'express'
// import con from '../utils/db.js'
// import jwt from 'jsonwebtoken'


// const router = express.Router()

// router.post('/login',(req, res) => {
//     const sql = "SELECT * FROM users WHERE email = ? and password = ?"
//     con.query(sql,[req.body.email, req.body.password], (err, result)=> {
//         if(err) return res.json({loginStatus: false, Error:"Query error"});
//         if(result.length > 0){
//             const email = result[0].email;
//             const userID = result[0].id;
//             const token = jwt.sign(
//                 {status: "Active", email: email, id: userID},
//                 "jwt_secret_key",
//                 {expiresIn: "1d"}
                
//             );
//             res.cookie('token', token)
//             return res.json({loginStatus: true, email: email, id:userID })
//         }else{
//             return res.json({loginStatus: false, Error: "Wrong email or password"});
//         }
//     });
// })

// export {router as loginRouter}