const db = require('../db/connect')
const { nanoid } = require('nanoid')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const multer = require('multer')
const bucket = require('../storage/upload')
const {storeData, getData} = require('../storage/firestore');

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
		fileSize: 2 * 1024 * 1024 // max file 2 MB
	}
});

exports.register = (req, res) => {
	upload.single('image')(req, res, function (err) {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		const { name, password, email } = req.body;

		if (!email || !password || !name) {
			return res.status(400).json({
				statusCode: 'fail',
				message: 'Mohon lengkapi data anda!'
			});
		}

		const cek = `select name, email from user`

		db.query(cek, async (err, fields) => {
			if (err) {
				return res.status(500).json({
					statusCode: 'Fail',
					message: err.message
				});
			}

			// const cekName = fields.some(user => user.name === name)
			// if (cekName) {
			// 	return res.status(409).json({
			// 		statusCode: 'fail',
			// 		message: 'nama telah digunakan'
			// 	})
			// }

			const cekEmail = fields.some(user => user.email === email)
			if (cekEmail) {
				return res.status(409).json({
					statusCode: 'fail',
					message: 'email telah digunakan'
				})
			}

			const hashPass = bcrypt.hashSync(password, 5);
			const user_id = nanoid(8);
			const image = req.file ? req.file.originalname : '';
			let publicUrl = ''


			try {
				if (req.file) {
					const upload = `${name}-${req.file.originalname}`
					const save = bucket.file(upload);
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

					await save.makePublic()

					publicUrl = `https://storage.googleapis.com/${bucket.name}/${save.name}`

				}

				const isNewAcc = true

				const sql = `insert into user (user_id, name, password, image, email, isNewAcc) VALUES ('${user_id}', '${name}', '${hashPass}', '${publicUrl}', '${email}', '${isNewAcc}')`;

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

						const token = jwt.sign(payload, 'jwtrahasia');

						return res.status(201).json({
							data,
							statusCode: 'Success',
							message: 'Register berhasil bang',
							auth: true,
							token: token,
							isNewAcc: isNewAcc
						});
					}
				});
			} catch (err) {
				res.status(500).json({
					statusCode: 'Fail',
					message: err.message
				});
			}
		})
	})
}

// ketika user melakukan login
exports.login = (req, res) => {
	const { email, password } = req.body

	if (!email || !password) {
		return res.status(400).json({
			statusCode: 'fail',
			message: 'email dan password diperlukan'
		})
	}

	const sql = `select * from user where email = '${email}'`

	db.query(sql, (err, data) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			// message: err.message
			message: 'Gagal login!'
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

		const token = jwt.sign(payload, 'jwtrahasia');

		let isNewAcc = user.isNewAcc = user.isNewAcc === 'true'

		res.status(200).json({ 
			auth: true, 
			token: token,
			isNewAcc: isNewAcc
		});
	})
}

// ketika user melakukan logout
exports.logout = (req, res) => {
	res.status(200).json({
		message: "Anda berhasil logout"
	})
}

// contoh aksi (uji coba mengambil user_id)
exports.profile = (req, res) => { //revisi buku dari history
	const userId = req.userId

	const sql = `select u.name, u.email, u.image, u.history
                  count(b.bookmark_id) as reading_list,
				  group_concat(distinct bk.judul separator ', ') as list_judul,
				  group_concat(distinct bk.image separator ', ') as list_image,
				  count(distinct r.rating_id) as list_rating
				from user u
				left join bookmarks b on u.user_id = b.user_id
				left join history h on h.user_id = u.user_id
				left join books bk on bk.books_id = h.books_id
				left join rating r on r.user_id = u.user_id
				where u.user_id = '${userId}'
				group by u.name, u.email, u.image`

	db.query(sql, async (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
			// message: 'Gagal menampilkan profile anda!'
		})

		const user = fields[0]

		if (user.history) {
			//lempar ke ml 5 buku terakhir
			const sql2 = `select books_id from history where user_id = '${userId}' 
							order by timestamp desc
							limit 10`
			db.query(sql2, (err, fields) => {
				if (err) {
					return res.status(500).json({
					  statusCode: 'fail',
					  message: err.message
					});
				  }

				  console.log(fields);
			})
		}

		res.status(200).json({
			statusCode: 'Success',
			message: 'Data user berhasil ditampilkan',
			name: user.name,
			email: user.email,
			image: user.image,
			reading_list: user.reading_list,
			list_judul: user.list_judul ? user.list_judul.split(',').map(list_judul => list_judul.trim()) : [],
			list_image: user.list_image ? user.list_image.split(',').map(list_image => list_image.trim()) : [],
			list_rating: user.list_rating,
			// list_image: user.list_image
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

		// update data breee
		const { name, password } = req.body

		if (!name || !password) {
			return res.status(404).json({
				statusCode: 'Fail',
				message: 'Mohon lengkapi data Anda!'
			});
		}

		const hashNewPass = bcrypt.hashSync(password, 5);


		const cek = `select user_id, name, email, image from user`

		db.query(cek, async (err, fields) => {
			if (err) {
				return res.status(500).json({
					statusCode: 'Fail',
					message: err.message
				});
			}

			// const cekName = fields.some(user => user.name === name && user.user_id !== userId)
			// if (cekName) {
			// 	return res.status(409).json({
			// 		statusCode: 'fail',
			// 		message: 'nama telah digunakan'
			// 	})
			// }

			// const cekEmail = fields.some(user => user.email === email && user.user_id !== userId)
			// if (cekEmail) {
			// 	return res.status(409).json({
			// 		statusCode: 'fail',
			// 		message: 'email telah digunakan'
			// 	})
			// }

			const user = fields.find(user => user.user_id === userId);

			let publicUrl = ''
			if (req.file) {
				try {

					if (user.image) {
						const namaFile = user.image.split('/').pop();
						const file = bucket.file(namaFile);
						await file.delete();
					}

					const upload = `${name}-${req.file.originalname}`
					const save = bucket.file(upload);
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
					await save.makePublic()

					publicUrl = `https://storage.googleapis.com/${bucket.name}/${save.name}`


				} catch (err) {
					return res.status(400).json({
						statusCode: 'fail',
						message: err.message
					});
				}
			}
			let sql = ''

			if (publicUrl !== '') {
				sql = `update user set name = '${name}', password = '${hashNewPass}', image = '${publicUrl}' where user_id = '${userId}'`
			} else {
				sql = `update user set name = '${name}', password = '${hashNewPass}' where user_id = '${userId}'`
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

					const token = jwt.sign(payload, 'jwtrahasia');

					res.status(201).json({
						data,
						statusCode: 'Success',
						message: 'Data Berhasil di edit',
						auth: true,
						token: token
					});
				}

			})
		})


	})
}

// belom connect ke machine learning
// exports.getBook = (req, res) => {
// 	const sql = `select * from books`

// 	db.query(sql, (err, fields) => {
// 		if (err) return res.status(500).json({
// 			statusCode: 'Fail',
// 			message: err.message
// 		})

// 		// console.log(fields);
// 		res.status(200).json({
// 			statusCode: 'Success',
// 			message: "Data berhasil ditampilkan",
// 			data: { fields }
// 		})
// 	})
// }

exports.filtering = (req, res) => { //dari rating tertinggi
	const { genre } = req.query
	const userId = req.userId
	// console.log(userId);

	if (!genre) {
		return res.status(404).json({
			statusCode: 'fail',
			message: 'Query dibutuhkan!'
		})
	}

	const sql = `select b.books_id, b.judul, b.image 
					from books b 
					join book_genres bg on bg.books_id = b.books_id
					join genres g on g.genre_id = bg.genre_id
					where g.genre = '${genre}' or g.genre like '%${genre}%'`

	db.query(sql, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
		})

		if (fields.length === 0) return res.status(400).json({
			statusCode: 'Fail',
			message: "Buku dengan genre tersebut tidak ditemukan!"
		})

		// console.log(fields);
		res.status(200).json({
			statusCode: 'Success',
			message: "Data berhasil ditampilkan (menggunakan query)",
			fields
		})
	})
}

exports.addRating = (req, res) => {
	const { rating, review } = req.body
	const { books_id } = req.query
	const userId = req.userId
	const rating_id = nanoid(8)

	if (!rating || !review) {
		return res.status(406).json({
			statusCode: 'fail',
			message: 'Mohon lengkapi Review anda!'
		})
	}

	if (!books_id) {
		return res.status(404).json({
			statusCode: 'fail',
			message: 'books_id diperlukan'
		})
	}

	const cek = `select books_id from books`

	db.query(cek, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'fail',
			message: err.message
		});

		const cekBookId = fields.some(book => book.books_id === parseInt(books_id))
		// console.log(fields, "ini req: ", books_id);
		// console.log(typeof(books_id));
		if (!cekBookId) {
			return res.status(409).json({
				statusCode: 'fail',
				message: 'ID Buku tidak ditemukan!'
			})
		}

		const cekUser = `select user_id, books_id from rating`

		db.query(cekUser, (err, fields) => {
			const udahAda = fields.some(rating => rating.user_id === userId && rating.books_id === books_id)

			let sql
			if (udahAda) {
				// console.log(userId, 'udah ada: ' + udahAda);
				sql = `update rating set rating = '${rating}', review = '${review}' where user_id = '${userId}' and books_id = '${books_id}'`
			} else {
				sql = `insert into rating (rating_id, user_id, books_id, rating, review) values ('${rating_id}', '${userId}', '${books_id}', ${rating}, '${review}')`
			}

			db.query(sql, (err, fields) => {
				if (err) return res.status(500).json({
					statusCode: 'fail',
					message: err.message
				})

				res.status(201).json({
					statusCode: 'Success',
					books_id: books_id,
					message: udahAda ? "Rating dan review berhasil diperbarui" : "Rating dan review berhasil ditambahkan",
				})
			})
		})
	})
}

exports.getHistory = (req, res) => { //books_id dan genre 5 sampe 10 terakhir
	const userId = req.userId

	const sql = `select distinct b.judul, b.image, b.books_id 
					from books b 
					join history h on h.books_id = b.books_id
					where h.user_id = '${userId}'`

	db.query(sql, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'fail',
			message: err.message
		})

		res.status(200).json({
			statusCode: 'Success',
			message: "Data berhasil ditampilkan",
			fields,
		})
	})
}


exports.detailBook = (req, res) => {
	const { id } = req.params;

	const sql = `
        SELECT 
            b.books_id,
            b.image,
            b.judul,
            b.penulis,
            b.deskripsi,
            b.penerbit,
            b.tahun_terbit,
            b.jml_halaman,
            b.ISBN,
            GROUP_CONCAT(g.genre SEPARATOR ', ') AS genre,
            ROUND(COALESCE(AVG(r.rating), 0), 2) AS avg_rating
        FROM 
            books b
        LEFT JOIN 
            rating r ON b.books_id = r.books_id
        LEFT JOIN 
            book_genres bg ON b.books_id = bg.books_id
        LEFT JOIN 
            genres g ON bg.genre_id = g.genre_id
        WHERE 
            b.books_id = ? OR b.judul = ?
        GROUP BY 
            b.books_id
    `;

	db.query(sql, [id, id], (err, result) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message || 'Unknown error'
			});
		}

		if (result.length === 0) {
			return res.status(404).json({
				statusCode: 'Fail',
				message: 'Buku tidak ditemukan!'
			});
		}

		const book = result[0];

		const response = {
			bookId: book.books_id,
			title: book.judul,
			synopsis: book.deskripsi,
			author: book.penulis,
			publisher: book.penerbit,
			year: book.tahun_terbit,
			pageCount: book.jml_halaman,
			isbn: book.ISBN,
			genre: book.genre ? book.genre.split(',').map(genre => genre.trim()) : [],
			coverImage: book.image,
			avgRating: book.avg_rating
		};

		if (req.terautentikasi) {
			// Cek apakah book id sudah ada di history
			const checkSql = `SELECT * FROM history WHERE books_id = ?`;
			db.query(checkSql, [book.books_id], (err, result) => {
				if (err) {
					return res.status(500).json({
						statusCode: 'Fail',
						message: err.message
					});
				}

				if (result.length > 0) {
					// book id ada di hitory, update time
					const updateSql = `UPDATE history SET time = CURRENT_TIMESTAMP WHERE books_id = ?`;
					db.query(updateSql, [book.books_id], (err) => {
						if (err) {
							return res.status(500).json({
								statusCode: 'Fail',
								message: err.message
							});
						}
						res.status(200).json(response);
					});
				} else {
					// book id tidak ada di history, insert data
					const history_id = nanoid(8);
					const insertSql = `INSERT INTO history (history_id, user_id, books_id, time) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
					db.query(insertSql, [history_id, req.userId, book.books_id], (err) => {
						if (err) {
							return res.status(500).json({
								statusCode: 'Fail',
								message: err.message
							});
						}
						res.status(200).json(response);
					});
				}
			});
		} else {
			res.status(200).json(response);
		}
	});
};

exports.addBookmark = (req, res) => {
	const { books_id } = req.body;
	const user_id = req.userId;

	if (!books_id) {
		return res.status(400).json({
			statusCode: 'Fail',
			message: 'books_id diperlukan'
		});
	}

	// Periksa apakah buku dengan books_id ada
	const sqlCheckBook = `SELECT * FROM books WHERE books_id = ?`;
	db.query(sqlCheckBook, [books_id], (err, bookResult) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		if (bookResult.length === 0) {
			return res.status(404).json({
				statusCode: 'Fail',
				message: 'Buku tidak ditemukan'
			});
		}

		// Periksa apakah bookmark untuk books_id sudah ada untuk user
		const sqlCheckBookmark = `SELECT * FROM bookmarks WHERE user_id = ? AND books_id = ?`;
		db.query(sqlCheckBookmark, [user_id, books_id], (err, bookmarkResult) => {
			if (err) {
				return res.status(500).json({
					statusCode: 'Fail',
					message: err.message
				});
			}

			if (bookmarkResult.length > 0) {
				return res.status(409).json({
					statusCode: 'Fail',
					message: 'Bookmark sudah ada'
				});
			}

			// Jika buku ditemukan dan bookmark belum ada, menambahkan bookmark
			const bookmark_id = nanoid(10);
			const sql = `INSERT INTO bookmarks (bookmark_id, user_id, books_id) VALUES (?, ?, ?)`;

			db.query(sql, [bookmark_id, user_id, books_id], (err, result) => {
				if (err) {
					return res.status(500).json({
						statusCode: 'Fail',
						message: err.message
					});
				}

				res.status(201).json({
					bookmarkId: bookmark_id,
					message: 'Sukses menambahkan bookmark'
				});
			});
		});
	});
};

exports.deleteBookmark = (req, res) => {
	const { bookmarks_id } = req.params;
	const user_id = req.userId;

	const sql = `DELETE FROM bookmarks WHERE bookmark_id = ? AND user_id = ?`;
	db.query(sql, [bookmarks_id, user_id], (err, result) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		if (result.affectedRows === 0) {
			return res.status(404).json({
				statusCode: 'Fail',
				message: 'Bookmark tidak ditemukan atau tidak dimiliki oleh pengguna ini'
			});
		}

		res.status(200).json({
			message: 'Bookmark berhasil dihapus'
		});
	});
};

exports.getBookmarks = (req, res) => {
	const userId = req.userId;

	const sql = `
        SELECT bk.bookmark_id, b.judul, b.image, b.penulis 
        FROM bookmarks bk
        JOIN books b ON bk.books_id = b.books_id
        WHERE bk.user_id = ?
    `;

	db.query(sql, [userId], (err, result) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		if (result.length === 0) {
			return res.status(204).json({
			});
		}

		res.status(200).json({
			bookmarks: result
		});
	});
};

exports.searchBooks = (req, res) => {
	const { title, author } = req.query;

	if (!title && !author) {
		return res.status(400).json({
			statusCode: 'Fail',
			message: 'Setidaknya salah satu dari title atau author harus disertakan'
		});
	}

	let sql = `SELECT books_id, image, judul, penulis FROM books WHERE 1=1`;
	let params = [];

	if (title) {
		sql += ` AND judul LIKE ?`;
		params.push(`%${title}%`);
	}

	if (author) {
		sql += ` AND penulis LIKE ?`;
		params.push(`%${author}%`);
	}

	db.query(sql, params, (err, results) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		if (results.length === 0) {
			return res.status(204).json({
			});
		}

		res.status(200).json({
			results: results
		});
	});
};



exports.chgPass = (req, res) => {
	const userId = req.userId

	const { newPass } = req.body

	if (!newPass) {
		return res.status(400).json({
			statusCode: 'fail',
			message: 'Mohon lengkapi Password anda!'
		})
	}

	const hashNewPass = bcrypt.hashSync(newPass, 5);

	const sql = `update user set password = '${hashNewPass}' where user_id = '${userId}'`

	db.query(sql, (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'fail',
			message: err.message
		})

		res.status(201).json({
			statusCode: 'Success',
			message: 'Password berhasil diperbarui'
		})
	})

}

exports.getGenres = (req, res) => {
	const sql = `SELECT DISTINCT genre FROM genres`;

	db.query(sql, (err, results) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		let genres = new Set();
		results.forEach(row => {
			if (row.genre) {
				row.genre.split(',').forEach(genre => genres.add(genre.trim()));
			}
		});

		let sortedGenres = Array.from(genres).sort();

		res.status(200).json({
			genres: sortedGenres
		});
	});
};

exports.preference = (req, res) => {
	const userId = req.userId
	const {genre} = req.body

	if(!genre) {
		return res.status(400).json({
			statusCode: 'Fail',
			message: 'Mohon pilih genre yang anda sukai !!'
		});
	}

	const sql = `update user set isNewAcc = '${false}' where user_id = '${userId}'`

	db.query(sql, async (err, fields) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		try {
			const respon = await axios.post('link cloud run', {user_id: userId, genre: genre}) //blom fix
				// .then(response => {
				// 	console.log(response.data);
				// })

			const rekomendasi = respon.data.rekomendasi
			// diatas itu books_id

			await storeData(userId, {genre: genre, rekomendasi: rekomendasi})		
			
		} catch (error) {
			res.status(400).json({
				statusCode: 'fail',
				message: error.message
			})
		}
	})

}

exports.getPreference = async (req, res) => {  // kirim userID hasinya gabung data baru
	const userId = req.userId

	const book = await getData(userId)

	try {
		if (book.exists) {
			return res.status(200).json({
				statusCode: 'success',
				message: 'berhasil',
			})
		} else {
			return res.status(400).json({
				statusCode: 'fail',
				message: 'Tidak ada prefrensi',
			})
		}
	} catch (error) {
		
	}

}