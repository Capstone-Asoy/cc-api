const db = require('../db/connect')
const { nanoid } = require('nanoid')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const multer = require('multer')
const bucket = require('../storage/upload')

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
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 5 * 1024 * 1024 // max file size 5 MB
	}
});

exports.register = (req, res) => {
	upload.single('image')(req, res, async function (err) {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		const { name, password, minat_genre, email, username } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				message: 'Email and password masih kosong!'
			});
		}

		const hashPass = bcrypt.hashSync(password, 5);
		const user_id = nanoid(8);
		const image = req.file ? req.file.originalname : '';

		const sql = `INSERT INTO user (user_id, name, password, minat_genre, username, image, email) VALUES (?, ?, ?, ?, ?, ?, ?)`;

		try {
			if (req.file) {
				const blob = bucket.file(req.file.originalname);
				const blobStream = blob.createWriteStream({
					resumable: false
				});

				blobStream.on('error', err => {
					throw new Error(err.message);
				});

				blobStream.on('finish', async () => {
					// File uploaded successfully, now insert into DB
					db.query(sql, [user_id, name, hashPass, minat_genre, username, image, email], (err, fields) => {
						if (err) {
							return res.status(500).json({
								statusCode: 'Fail',
								message: err.message
							});
						}

						if (fields.affectedRows) {
							const data = {
								isSucces: fields.affectedRows,
								id: user_id
							};

							const payload = {
								id: user_id,
								name: name
							};

							const token = jwt.sign(payload, 'jwtrahasia', {
								expiresIn: 86400 // aktif selama 24 jam
							});

							res.status(201).json({
								data,
								statusCode: 'Success',
								message: 'Register berhasil bang',
								auth: true,
								token: token
							});
						}
					});
				});

				blobStream.end(req.file.buffer);
			}
		} catch (err) {
            res.status(500).json({
                statusCode: 'Fail',
                message: err.message
            });
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
exports.profile = (req, res) => {
	const userId = req.userId

	const sql = `select * from user where user_id = '${userId}'`

	db.query(sql, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
		})

		// console.log("data berhasil ditambahkans");
		const data = {
			id: req.userId,
			name: req.name
		}
		res.status(201).json({
			statusCode: 'Success',
			message: 'Data user berhasil ditampilkan',
			data,
		})
	})
}

exports.editProfile = (req, res) => {
	const userId = req.userId
	const { nama, minat_genre } = req.body

	const sql = `update user set name = '${nama}', minat_genre = '${minat_genre}' where user_id = '${userId}'`

	db.query(sql, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
		})

		const data = {
			id: req.userId,
			name: nama,
			minat_genre: minat_genre
		}

		const payload = {
			id: req.userId,
			name: nama
		}

		const token = jwt.sign(payload, 'jwtrahasia', {
			expiresIn: 86400 // aktif selama 24 jam 
		});

		res.status(201).json({
			statusCode: 'Success',
			message: 'Data berhasil di edit',
			data,
			token
		})
	})
}

exports.getBook = (req, res) => {
	const sql = `select * from books`

	db.query(sql, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
		})

		// console.log(fields);
		res.status(200).json({
			statusCode: 'Success',
			message: "Data berhasil ditampilkan",
			data: { fields }
		})
	})
}

exports.filtering = (req, res) => {
	const { genre } = req.query
	const userId = req.userId
	console.log(userId);

	const sql = `select * from books where genre like '%${genre}%'`

	db.query(sql, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
		})

		console.log(fields);
		res.status(200).json({
			statusCode: 'Success',
			message: "Data berhasil ditampilkan (menggunakan query)",
			data: { fields }
		})
	})
}