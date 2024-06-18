const db = require('../db/connect')
const { nanoid } = require('nanoid')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const multer = require('multer')
const bucket = require('../storage/upload')
// const validator = require('validator')
const { storeData, getData, updateData } = require('../storage/firestore');
const axios = require('axios');

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

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 2 * 1024 * 1024 // 2 MB
	}
});

function validEmail(email) {
	const domain = email.split('@')[1];
	const cekDomain = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
	return cekDomain.includes(domain);
}

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

		if (!validEmail(email)) {
			return res.status(400).json({
				statusCode: 'fail',
				message: 'Format email tidak valid'
			});
		}

		const cek = `SELECT name, email FROM user`

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

				const sql = `INSERT INTO user (user_id, name, password, image, email, isNewAcc, history) VALUES ('${user_id}', '${name}', '${hashPass}', '${publicUrl}', '${email}', '${isNewAcc}', 'false')`;

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

exports.login = (req, res) => {
	const { email, password } = req.body

	if (!email || !password) {
		return res.status(400).json({
			statusCode: 'fail',
			message: 'email dan password diperlukan'
		})
	}

	const sql = `SELECT * FROM user WHERE email = '${email}'`

	db.query(sql, (err, data) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
			// message: 'Gagal login!'
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
		let history = user.history = user.history === 'true'

		res.status(200).json({
			auth: true,
			token: token,
			isNewAcc: isNewAcc,
			haveHistory: history
		});
	})
}

exports.logout = (req, res) => {
	res.status(200).json({
		message: "Anda berhasil logout"
	})
}

exports.profile = (req, res) => { //revisi buku dari history
	const userId = req.userId

	const sql = `SELECT u.name, u.email, u.image, u.history,
                  (SELECT COUNT(b.bookmark_id) FROM bookmarks b WHERE b.user_id = u.user_id) as reading_list,
				  GROUP_CONCAT(DISTINCT REPLACE(bk.judul, ',', '') separator ', ') as list_judul,
				  GROUP_CONCAT(DISTINCT bk.image separator ', ') as list_image,
				  COUNT(DISTINCT r.rating_id) as list_rating
				FROM user u
				LEFT JOIN history h on h.user_id = u.user_id
				LEFT JOIN books bk on bk.books_id = h.books_id
				LEFT JOIN rating r on r.user_id = u.user_id
				WHERE u.user_id = '${userId}'
				GROUP BY u.name, u.email, u.image`

	db.query(sql, async (err, fields) => {
		if (err) return res.status(500).json({
			statusCode: 'Fail',
			message: err.message
			// message: 'Gagal menampilkan profile anda!'
		})

		const user = fields[0]

		const history = user.history = user.history === 'true'

		//mengirim user id ke cloud run
		// const cloudRunURL = process.env.CLOUD_RUN_URL || 'https://link-cloud-run/endpoint'; //url cloud run nanti di taruh di sini
		// const payload = { userId };

		// try {
		// 	await axios.post(cloudRunURL, payload);
		// 	console.log('User ID berhasil dikirim ke Cloud Run');
		// } catch (error) {
		// 	console.log('Gagal mengirim user ID ke Cloud Run', error.message);
		// }

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
			haveHistory: history
			// list_image: user.list_image
		})
	})
}

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
			return res.status(400).json({
				statusCode: 'Fail',
				message: 'Mohon lengkapi data Anda!'
			});
		}

		const hashNewPass = bcrypt.hashSync(password, 5);


		const cek = `SELECT user_id, name, email, image FROM user`

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
				sql = `UPDATE user SET name = '${name}', password = '${hashNewPass}', image = '${publicUrl}' WHERE user_id = '${userId}'`
			} else {
				sql = `UPDATE user SET name = '${name}', password = '${hashNewPass}' WHERE user_id = '${userId}'`
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

exports.filtering = async (req, res) => { //dari rating tertinggi
	const { genre } = req.query

	if (!genre) {
		return res.status(404).json({
			statusCode: 'fail',
			message: 'Query dibutuhkan!'
		})
	}

	const sql = `SELECT b.books_id, b.judul, b.image 
					FROM books b 
					JOIN book_genres bg on bg.books_id = b.books_id
					JOIN genres g on g.genre_id = bg.genre_id
					WHERE g.genre = '${genre}'
					ORDER BY RAND()
					LIMIT 30`

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

	const cek = `SELECT books_id from books`

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

		const cekUser = `SELECT user_id, books_id FROM rating WHERE user_id = '${userId}' AND books_id = '${books_id}'`

		db.query(cekUser, (err, fields) => {
			const udahAda = fields.length > 0

			// console.log(udahAda);

			let sql
			if (udahAda) {
				// console.log(userId, 'udah ada: ' + udahAda);
				sql = `UPDATE rating SET rating = '${rating}', review = '${review}' WHERE user_id = '${userId}' and books_id = '${books_id}'`
			} else {
				sql = `INSERT INTO rating (rating_id, user_id, books_id, rating, review) VALUES ('${rating_id}', '${userId}', '${books_id}', ${rating}, '${review}')`
			}

			db.query(sql, (err, fields) => {
				if (err) return res.status(500).json({
					statusCode: 'fail',
					message: err.message
				})

				const cek = `SELECT user_id, books_id FROM history WHERE user_id = '${userId}' and  books_id = '${books_id}'`

				db.query(cek, (err, cekHistory) => {
					if (err) return res.status(500).json({
						statusCode: 'fail',
						message: err.message
					})

					let update = ``

					const ada = cekHistory.length > 0

					if (ada) {
						update = `UPDATE history set time = current_timestamp WHERE user_id = '${userId}'`
					} else {
						const historyId = nanoid(8)
						update = `INSERT INTO history (history_id, user_id, books_id) VALUES ('${historyId}', '${userId}', '${books_id}')`
					}

					db.query(update, (err, fields) => {
						if (err) return res.status(500).json({
							statusCode: 'fail',
							message: err.message
						})

						const history = `SELECT books_id FROM history WHERE user_id = '${userId}'`

						db.query(history, (err, fields) => {
							if (err) {
								return res.status(500).json({
									statusCode: 'Fail',
									message: err.message
								});
							}

							const hvHistory = fields.map(row => row.books_id)

							// console.log(hvHistory);
							// console.log(hvHistory.length);

							if (hvHistory.length >= 5) {
								const updateHistory = `UPDATE user SET history = 'true' WHERE user_id = '${userId}'`

								db.query(updateHistory, (err, fields) => {
									if (err) {
										return res.status(500).json({
											statusCode: 'Fail',
											message: err.message
										});
									}

									// res.status(201).json({
									// 	statusCode: 'success',
									// 	message: 'History berhasil di update'
									// })
								})
							}
						})

						// if (fields.affectedRows) {
						// 	console.log(fields.affectedRows);
						// }
					})

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

	const sql = `SELECT distinct b.judul, b.image, b.books_id 
					FROM books b 
					JOIN history h on h.books_id = b.books_id
					WHERE h.user_id = '${userId}'`

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

	const bookSql = `
    SELECT b.books_id, b.image, b.judul, b.penulis, b.deskripsi, b.penerbit, b.tahun_terbit, b.jml_halaman, b.ISBN,
        GROUP_CONCAT(g.genre SEPARATOR ', ') AS genre
    FROM books b
    LEFT JOIN book_genres bg ON b.books_id = bg.books_id
    LEFT JOIN genres g ON bg.genre_id = g.genre_id
    WHERE b.books_id = ? OR b.judul = ?
    GROUP BY b.books_id LIMIT 1`;

	const getReview = `
    SELECT u.name AS name, r.rating, r.review, DATE(r.date) AS review_date
    FROM rating r
    LEFT JOIN user u ON r.user_id = u.user_id
    WHERE r.books_id = ?
    ORDER BY r.date DESC`;

	db.query(bookSql, [id, id], (err, bookResults) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message || 'Unknown error'
			});
		}

		if (bookResults.length === 0) {
			return res.status(404).json({
				statusCode: 'Fail',
				message: 'Buku tidak ditemukan!'
			});
		}

		const bookData = bookResults[0];

		db.query(getReview, [bookData.books_id], (err, hasilReview) => {
			if (err) {
				return res.status(500).json({
					statusCode: 'Fail',
					message: err.message || 'Unknown error'
				});
			}

			const reviews = hasilReview.map(review => {
				const reviewDate = new Date(review.review_date);
				const formattedDate = reviewDate.toISOString().split('T')[0];
				return {
					userName: review.name || 'Anonim',
					rating: review.rating,
					review: review.review || 'Bukunya bagus banget!!',
					date: formattedDate
				};
			});

			const ratings = hasilReview.map(result => result.rating);
			const totalRating = ratings.reduce((total, rating) => total + rating, 0);
			const avgRating = ratings.length > 0 ? totalRating / ratings.length : 0;
			const genres = bookData.genre ? bookData.genre.split(',').map(genre => genre.trim()) : [];

			const book = {
				bookId: bookData.books_id,
				title: bookData.judul,
				synopsis: bookData.deskripsi,
				author: bookData.penulis,
				publisher: bookData.penerbit,
				year: bookData.tahun_terbit,
				pageCount: bookData.jml_halaman,
				isbn: bookData.ISBN,
				genre: genres,
				coverImage: bookData.image,
				avgRating: avgRating.toFixed(2),
				reviews: reviews
			};

			if (req.terautentikasi) {
				const checkSql = `SELECT * FROM history WHERE books_id = ? AND user_id = ?`;
				db.query(checkSql, [book.bookId, req.userId], (err, result) => {
					if (err) {
						return res.status(500).json({
							statusCode: 'Fail',
							message: err.message
						});
					}

					if (result.length > 0) {
						const updateSql = `UPDATE history SET time = CURRENT_TIMESTAMP WHERE books_id = ? AND user_id = ?`;
						db.query(updateSql, [book.bookId, req.userId], (err) => {
							if (err) {
								return res.status(500).json({
									statusCode: 'Fail',
									message: err.message
								});
							}
						});
					} else {
						const history_id = nanoid(8);
						const insertSql = `INSERT INTO history (history_id, user_id, books_id, time) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
						db.query(insertSql, [history_id, req.userId, book.bookId], (err) => {
							if (err) {
								return res.status(500).json({
									statusCode: 'Fail',
									message: err.message
								});
							}
						});
					}

					const historyQuery = `UPDATE user SET history = 'true' WHERE user_id = ? AND (SELECT COUNT(books_id) FROM history WHERE user_id = ?) >= 5`;
					db.query(historyQuery, [req.userId, req.userId], (err) => {
						if (err) {
							return res.status(500).json({
								statusCode: 'Fail',
								message: err.message
							});
						}
					});
				});

				const bookmarkCheckSql = `SELECT * FROM bookmarks WHERE books_id = ? AND user_id = ?`;
				db.query(bookmarkCheckSql, [book.bookId, req.userId], (err, result) => {
					if (err) {
						return res.status(500).json({
							statusCode: 'Fail',
							message: err.message
						});
					}

					book.isBookmarked = result.length > 0;
					res.status(200).json(book);
				});
			} else {
				res.status(200).json(book);
			}
		});
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
	const { books_id } = req.params;
	const userId = req.userId;

	const sql = `DELETE FROM bookmarks WHERE books_id = ? AND user_id = ?`;
	db.query(sql, [books_id, userId], (err, result) => {
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
        SELECT bk.bookmark_id, b.judul, b.image, b.penulis, b.books_id 
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

		res.status(200).json({
			bookmarks: result
		});
	});
};

exports.searchBooks = (req, res) => {
	const { keyword } = req.query;

	if (!keyword) {
		return res.status(400).json({
			statusCode: 'Fail',
			message: 'Keyword harus disertakan'
		});
	}

	let keywords = keyword.split(' ');
	let sql = `SELECT books_id, image, judul, penulis FROM books WHERE 1=1`;
	let params = [];

	keywords.forEach(kw => {
		sql += ` AND (judul LIKE ? OR penulis LIKE ?)`;
		params.push(`%${kw}%`, `%${kw}%`);
	});

	db.query(sql, params, (err, results) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		res.status(200).json({
			results: results
		});
	});
};


// exports.chgPass = (req, res) => {
// 	const userId = req.userId

// 	const { newPass } = req.body

// 	if (!newPass) {
// 		return res.status(400).json({
// 			statusCode: 'fail',
// 			message: 'Mohon lengkapi Password anda!'
// 		})
// 	}

// 	const hashNewPass = bcrypt.hashSync(newPass, 5);

// 	const sql = `update user set password = '${hashNewPass}' where user_id = '${userId}'`

// 	db.query(sql, (err, fields) => {
// 		if (err) return res.status(500).json({
// 			statusCode: 'fail',
// 			message: err.message
// 		})

// 		res.status(201).json({
// 			statusCode: 'Success',
// 			message: 'Password berhasil diperbarui'
// 		})
// 	})

// }

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
	const { selectedGenres } = req.body

	if (!selectedGenres) {
		res.status(400).json({
			statusCode: 'Fail',
			message: 'Mohon pilih genre yang anda sukai !!'
		});
	}

	const sql = `UPDATE user SET isNewAcc = '${false}' WHERE user_id = '${userId}'`

	db.query(sql, async (err, fields) => {
		if (err) {
			res.status(500).json({
				statusCode: 'Fail',
				message: err.message
			});
		}

		try {
			const respon = await axios.post('https://model-hen5ogfoeq-et.a.run.app/add_user', {genre: selectedGenres}) //blom fix
			// .then(response => {
			// 	console.log(response.data);
			// })

			const user_id = respon.data.User_id

			const getBook = await axios.post('https://model-hen5ogfoeq-et.a.run.app/user_recommend', {user: user_id});
			console.log(user_id);

			const dataBuku = getBook.data.data
			// console.log(getBook.data.data);

			await storeData(userId, {genre: selectedGenres, rekomendasi: dataBuku})		


			res.status(200).json({
				statusCode: 'Success',
				message: 'Preferensi akan diproses',
				// Rekomendasi: rekomendasi
			})
		} catch (error) {
			res.status(400).json({
				statusCode: 'fail',
				message: error.response ? error.response.data : error.message
			})
		}
	})

}

exports.getPreference = async (req, res) => {  // kirim userID hasinya gabung data baru
	const userId = req.userId;

	try {
		const book = await getData(userId);

		if (!book.exists) {
			return res.status(400).json({
				statusCode: 'fail',
				message: 'Tidak ada preferensi',
			});
		}

		const rekomendasi = book.data().rekomendasi.map(Number)

		const sql = `SELECT u.history, (SELECT GROUP_CONCAT(books_id) 
						FROM ( SELECT books_id
								FROM history 
        						WHERE user_id = '${userId}'
        						ORDER BY time DESC  
        						LIMIT 5
    						) AS terbaru
						) AS recent,
						COUNT(b.bookmark_id) AS bookmarks,
						IF(COUNT(b.bookmark_id) >= 5, 
							GROUP_CONCAT(b.books_id ORDER BY b.time DESC LIMIT 5), 
							NULL
						) AS recent_bookmarks
					FROM user u
					LEFT JOIN bookmarks b ON u.user_id = b.user_id
					WHERE u.user_id = '${userId}'
					GROUP BY u.user_id;`;

		db.query(sql, async (err, hasil) => {
			if (err) {
				return res.status(500).json({
					statusCode: 'fail',
					message: err.message
				});
			}

			const user = hasil[0];
			const history = user.history === 'true';
			const recent = user.recent ? user.recent.split(',').map(Number) : []
			const bookmarks = user.bookmarks ? parseInt(user.bookmarks) : 0;
            const recentBookmarks = user.recent_bookmarks ? user.recent_bookmarks.split(',').map(Number) : [];

			console.log(recent);

			let dataBuku = rekomendasi;
			let dariHistory;
			let dariBookmarks;

			if (history) {
				// console.log(recent);
				const getBooks_id = await axios.post('https://model-hen5ogfoeq-et.a.run.app/book_recommend', {books: recent})

				const booksID = getBooks_id.data.data

				// await updateData(userId, recent); // untuk testing
				await updateData(userId, booksID); 

				const history = await getData(userId)
				const History_book = history.data().history

				const query = `SELECT books_id, judul, image FROM books WHERE books_id in (?)`;

				db.query(query, [History_book], (err, fields) => {
					if (err) {
						return res.status(500).json({
							statusCode: 'fail',
							message: err.message
						});
					}
					dariHistory = fields
				})

				// console.log(dariHistory);
			} else {
				dariHistory = [];
			}

			if (bookmarks >= 5) {
                const getBooks_id = await axios.post('https://model-hen5ogfoeq-et.a.run.app/book_recommend', { books: recentBookmarks });
                const booksID = getBooks_id.data.data;
                await updateBookmark(userId, booksID);

                const bookmarkData = await getData(userId);
                const Bookmark_book = bookmarkData.data().bookmark;

                const query = `SELECT books_id, judul, image FROM books WHERE books_id in (?)`;

                db.query(query, [Bookmark_book], (err, fields) => {
                    if (err) {
                        return res.status(500).json({
                            statusCode: 'fail',
                            message: err.message
                        });
                    }
                    dariBookmarks = fields;
                });
            } else {
                dariBookmarks = [];
            }

			const query = `SELECT books_id, judul, image FROM books WHERE books_id in (?)`;

			db.query(query, [dataBuku], (err, fields) => {
				if (err) {
					return res.status(500).json({
						statusCode: 'fail',
						message: err.message
					});
				}

				return res.status(200).json({
					statusCode: 'success',
					message: 'Berhasil',
					rekomendasi: fields,
					dariHistory: dariHistory,
					bookmark: dariBookmarks
				});
			});
		});
	} catch (error) {
		return res.status(400).json({
			statusCode: 'fail',
			message: error.message,
		});
	}
}