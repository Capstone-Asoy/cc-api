const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const router = require('../routes/routes')

const PORT = process.env.PORT || 8080;

app.use(bodyParser.json())

app.use(router)
// app.use('/auth', router)

app.get('/readiness_check', (req, res) => {
	res.status(200).send('OK');
});

app.listen(PORT, () => {
	console.log(`Example app listening on port http://localhost:${PORT}`)
})