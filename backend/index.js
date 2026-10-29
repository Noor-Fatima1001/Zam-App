
const express = require('express');
const app = express();
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const sql = require('mysql2');


app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
app.use(express.json());

app.use('/', userRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server has started on port ${port}`);
});
























// import express from "express";
// const app = express();
// import cors from 'cors';
// // import { loginRouter } from "./Routes/LoginRoute.js";
// import { router } from "./routes/userRoutes.js";





// app.use(cors());
// app.use(express.urlencoded({ extended: true }));
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     next();
// });
// app.use(express.json());

// app.use('/', userRoutes);


// app.use(express.json());
// app.use('/', router);

// // app.use(cors({
// //     origin: ["http://localhost:3001"],
// //     methods: ['GET', 'POST', 'PUT'],
// //     credentials: true
// // }))

// // app.use('/auth', loginRouter)

// app.listen(3000,() => {
//     console.log("server is running")
// })