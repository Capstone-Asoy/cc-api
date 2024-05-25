const db = require('../db/connect')
const { nanoid } = require('nanoid')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

exports.path = (req, res) => {
	try {
		return res.status(200).json({
			statusCode: 'success',
			Message: 'Backend API',
		});
	} catch (error) {
		return res.status(400).json({
			statusCode: 'fail',
			Message: 'not found',
		});
	}
}

// ketika user melakuakn register
exports.register = (req, res) => {
	const { name, password, minat_genre } = req.body

	if (!name || !password) {
		return res.status(400).json({
			message: 'name and password masih kosong!'
		});
	}

	const hashPass = bcrypt.hashSync(password, 5);
	const user_id = nanoid(8)

	const sql = `insert into user (user_id, name, password, minat_genre) values ('${user_id}', '${name}', '${hashPass}', '${minat_genre}')`

	db.query(sql, (err, fields) => {
		// if (err) throw err
		// kode diatas akan menyebabkan crash maka dari itu menggunakan kode dibawah
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
		})
		if (fields?.affectedRows) {
			// console.log("data berhasil ditambahkans");
			const data = {
				isSucces: fields.affectedRows,
				id: user_id
			}

			const payload = {
				id: user_id,
				name: name
			}
		
			const token = jwt.sign(payload, 'jwtrahasia', {
				expiresIn: 86400 // aktif selama 24 jam 
			});
		
			res.status(201).json({
				data,
				statusCode: 'Success',
				message: 'Register berhasil bang',
				auth: true, 
				token: token
			})
		}
	})
}

// ketika user melakukan login
exports.login = (req, res) => {
	const { name, password } = req.body

	if (!name || !password) {
		return res.status(400).json({
			message: 'nama dan password diperlukan'
		})
	}

	const sql = `select * from user where name = '${name}'`

	db.query(sql, (err, data) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
		})

		if (data.length === 0) return res.status(404).json({
			statusCode: 'Fail',
			message: "User tidak ditemukan"
		})

		const [user] = data

		const cekPassword = bcrypt.compareSync(password, user.password);
		if (!cekPassword) {
			return res.status(401).json({
				statusCode: 'Fail',
				message: 'Password salah'
			})
		}

		const payload = {
			id: user.user_id,
			name: user.name
		}

		const token = jwt.sign(payload, 'jwtrahasia', {
			expiresIn: 86400 // aktif selama 24 jam 
		});

		res.status(200).json({ auth: true, token: token });
	})
}

// ketika user melakukan logout
exports.logout = (req, res) => {
	res.status(200).json({
		message: "Anda berhasil logout"
	})
}

// contoh aksi (uji coba mengambil user_id)
exports.aksi = (req, res) => {
	const userId = req.userId
	const { aksi } = req.body

	const sql = `insert into aksi (user_id, action) values ('${userId}', '${aksi}')`

	db.query(sql, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
		})

		if (fields?.affectedRows) {
			// console.log("data berhasil ditambahkans");
			const data = {
				isSucces: fields.affectedRows,
				id: req.userId,
				name: req.name
			}
			res.status(201).json({
				data,
				statusCode: 'Success',
				message: 'Data berhasil disimpan'
			})
		}
	})
}