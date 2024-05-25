const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const router = require('./routes/routes')


app.use(bodyParser.json())

app.use(router)
// app.use('/auth', router)

app.listen(port, () => {
	console.log(`Example app listening on port http://localhost:${port}`)
})