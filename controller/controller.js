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
		fileSize: 2 * 1024 * 1024 // max file 5 MB
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

		const { name, password, email, username } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				message: 'Email and password masih kosong!'
			});
		}

		const hashPass = bcrypt.hashSync(password, 5);
		const user_id = nanoid(8);
		const image = req.file ? req.file.originalname : '';

		const sql = `insert into user (user_id, name, password, username, image, email) VALUES ('${user_id}', '${name}', '${hashPass}', '${username}', '${image}', '${email}')`;

		try {
			if (req.file) {
				const save = bucket.file(req.file.originalname);
				const saveToBucket = save.createWriteStream({
					resumable: false
				});

				saveToBucket.on('error', err => {
					throw new Error(err.message);
				});

				const uploadFinished = new Promise((resolve, reject) => {
					saveToBucket.on('finish', resolve);
					saveToBucket.on('error', reject);
				});

				saveToBucket.end(req.file.buffer);

				await uploadFinished


				db.query(sql, (err, fields) => {
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
							name: name,
							email: email
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
	const { email, password } = req.body

	if (!email || !password) {
		return res.status(400).json({
			message: 'email dan password diperlukan'
		})
	}

	const sql = `select * from user where email = '${email}'`

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
			name: user.name,
			email: user.email
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

	const sql = `select u.name, u.username, u.image, 
                  count (b.bookmark_id) as reading_list
				from user u
				left join bookmarks b on u.user_id = b.user_id
				where u.user_id = '${userId}'`

	db.query(sql, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
		})

		// console.log("data berhasil ditambahkans");
		// const data = {
		//    id: req.userId,
		//    name: req.name
		// }
		res.status(201).json({
			statusCode: 'Success',
			message: 'Data user berhasil ditampilkan',
			data: fields
		})
	})
}

//belom valid
exports.editProfile = (req, res) => {
	upload.single('image')(req, res, async function (err) {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		const userId = req.userId

		// const getSql = `select user_id, name, username, image from user where user_id = '${userId}'`

		// db.query(getSql, async (err, fields) => {
		// 	if (err) return res.status(500).json({
		// 		statusCode: 'Fail',
		// 		message: err.message
		// 	})

		// 	let updateImage = fields.image

		// 	if (req.file) {
		// 		try {
		// 			await bucket.file(updateImage).delete()
		// 		} catch (err) {
		// 			return res.status(400).json({
		// 				statusCode: 'fail',
		// 				message: err.message
		// 			});
		// 		}
		// 	}

		// 	res.status(201).json({
		// 		statusCode: 'Success',
		// 		message: 'Data sebelum di edit',
		// 		fields,
		// 		token
		// 	})
		// })
		// hadehhh ~~~~~~~~~~~~~~~~

		// update data breee
		const { name, username } = req.body
		const image = req.file ? req.file.originalname : '';
		const sql = `update user set name = '${name}', username = '${username}', image = '${image}' where user_id = '${userId}'`

		try {

			if (req.file) {
				try {
					const save = bucket.file(req.file.originalname);
					const saveToBucket = save.createWriteStream({
						resumable: false
					});

					saveToBucket.on('error', err => {
						throw new Error(err.message);
					});

					const uploadFinished = new Promise((resolve, reject) => {
						saveToBucket.on('finish', resolve);
						saveToBucket.on('error', reject);
					});

					saveToBucket.end(req.file.buffer);

					await uploadFinished
				} catch (err) {
					return res.status(400).json({
						statusCode: 'fail',
						message: err.message
					});
				}
			}

			db.query(sql, (err, fields) => {
				if (err) return res.status(500).json({
					statusCode: 'fail',
					message: err.message
				})

				if (fields.affectedRows) {
					const data = {
						isSucces: fields.affectedRows,
						id: req.userId
					};

					const payload = {
						id: req.userId,
						name: name,
						email: req.email
					};

					const token = jwt.sign(payload, 'jwtrahasia', {
						expiresIn: 86400 // aktif selama 24 jam
					});

					res.status(201).json({
						data,
						statusCode: 'Success',
						message: 'data setelah di edit',
						auth: true,
						token: token
					});
				}

			})
		} catch (err) {
			res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}
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