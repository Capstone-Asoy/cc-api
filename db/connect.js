const mysql = require('mysql')

const db = mysql.createConnection({
    host: "localhost", 
    user: "root", 
    password: "", 
    database: "backend"

    // host: "34.101.37.172",
    // user: "root",
    // password: "bookmate",
    // database: "backend"
})

module.exports = db