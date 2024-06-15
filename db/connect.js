const mysql = require('mysql')
require('dotenv').config()

const db = mysql.createConnection({
    // host: "localhost", 
    // user: "root", 
    // password: "", 
    // database: "backend"

    host: process.env.HostDB,
    user: process.env.UserDB,
    password: process.env.PasswordDB,
    database: process.env.Database
})

module.exports = db