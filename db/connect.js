// membuat variable yang membutuhkan node modul mysql
const mysql = require('mysql')
// membuat variable db untuk memanggil function yang ada dalam variable mysql
const db = mysql.createConnection({
    // host: "localhost", 
    // user: "root", 
    // password: "", 
    // database: "backend"

    host: "34.101.37.172",
    user: "root",
    password: "bookmate",
    database: "backend"
})

// menjadikan db sebagai modul agar bisa dipakai diluar file connect.js
module.exports = db