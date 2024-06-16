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
				  GROUP_CONCAT(DISTINCT bk.judul separator ', ') as list_judul,
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
		const cloudRunURL = process.env.CLOUD_RUN_URL || 'https://link-cloud-run/endpoint'; //url cloud run nanti di taruh di sini
		const payload = { userId };

		try {
			await axios.post(cloudRunURL, payload);
			console.log('User ID berhasil dikirim ke Cloud Run');
		} catch (error) {
			console.log('Gagal mengirim user ID ke Cloud Run', error.message);
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
	const userId = req.userId
	const getBook = await getData(userId);
	// console.log(userId);

	if (!genre) {
		return res.status(404).json({
			statusCode: 'fail',
			message: 'Query dibutuhkan!'
		})
	}

	if (getBook.exists) {
		const buku = getBook.data().rekomendasi

		// console.log(buku);

		const sql = `SELECT b.books_id, b.judul, b.image 
					FROM books b 
					JOIN book_genres bg on bg.books_id = b.books_id
					JOIN genres g on g.genre_id = bg.genre_id
					WHERE g.genre = '${genre}' and b.books_id in (?)`

		db.query(sql, [buku], (err, fields) => {
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
	} else {
		const sql = `SELECT b.books_id, b.judul, b.image 
					FROM books b 
					JOIN book_genres bg on bg.books_id = b.books_id
					JOIN genres g on g.genre_id = bg.genre_id
					WHERE g.genre = '${genre}' or g.genre like '%${genre}%'`

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
            u.name AS user_name,
            r.rating,
            r.review,
            DATE(r.date) AS review_date
        FROM 
            books b
        LEFT JOIN 
            rating r ON b.books_id = r.books_id
        LEFT JOIN 
            book_genres bg ON b.books_id = bg.books_id
        LEFT JOIN 
            genres g ON bg.genre_id = g.genre_id
        LEFT JOIN 
            user u ON r.user_id = u.user_id
        WHERE 
            b.books_id = ? OR b.judul = ?
        GROUP BY 
            b.books_id, r.rating
        LIMIT 50
    `;

	db.query(sql, [id, id], (err, results) => {
		if (err) {
			return res.status(500).json({
				statusCode: 'Fail',
				message: err.message || 'Unknown error'
			});
		}

		if (results.length === 0) {
			return res.status(404).json({
				statusCode: 'Fail',
				message: 'Buku tidak ditemukan!'
			});
		}

		const bookData = results[0];
		const reviews = results
			.filter(review => review.user_name) 
			.map(review => {
				const reviewDate = new Date(review.review_date);
				const formattedDate = reviewDate.toISOString().split('T')[0]; 
				return {
					userName: review.user_name,
					rating: review.rating,
					review: review.review,
					date: formattedDate
				};
			});

		const ratings = results.map(result => result.rating); 
		const totalRating = ratings.reduce((total, rating) => total + rating, 0);
		const avgRating = ratings.length > 0 ? totalRating / ratings.length : 0;

		const book = {
			bookId: bookData.books_id,
			title: bookData.judul,
			synopsis: bookData.deskripsi,
			author: bookData.penulis,
			publisher: bookData.penerbit,
			year: bookData.tahun_terbit,
			pageCount: bookData.jml_halaman,
			isbn: bookData.ISBN,
			genre: bookData.genre ? bookData.genre.split(',').map(genre => genre.trim()) : [],
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
						res.status(200).json(book);
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
						res.status(200).json(book);
					});
				}

				const history = `select books_id from history where user_id = '${req.userId}'`

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
						const updateHistory = `update user set history = 'true' where user_id = '${req.userId}'`

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

				book.isBookmarked = result.length > 0 ? true : false;
				res.status(200).json(book);
			});
			
		} else {
			res.status(200).json(book);
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
			// const respon = await axios.post('link cloud run', {user_id: userId, genre: genre}) //blom fix
			// .then(response => {
			// 	console.log(response.data);
			// })

			// const rekomendasi = respon.data.rekomendasi
			// diatas itu books_id
			// await storeData(userId, {genre: genre, rekomendasi: rekomendasi})		

			await storeData(userId, { genre: selectedGenres, rekomendasi: [1, 5, 9, 45, 556, 21, 65, 78] }) //untuk testing brooww chessshhh

			res.status(200).json({
				statusCode: 'Success',
				message: 'Preferensi akan diproses',
				// Rekomendasi: rekomendasi
			})
		} catch (error) {
			res.status(400).json({
				statusCode: 'fail',
				message: error.message
			})
		}
	})

}

exports.getPreference = async (req, res) => {  // kirim userID hasinya gabung data baru
	const userId = req.userId;

	try {
		const book = await getData(userId);

		if (book.exists) {
			const sql = `SELECT history FROM user WHERE user_id = '${userId}'`;
			db.query(sql, (err, userResults) => {
				if (err) {
					return res.status(500).json({
						statusCode: 'fail',
						message: err.message
					});
				}

				const user = userResults[0];

				let history = user.history = user.history === 'true'

				if (history) {
					const sql2 = `SELECT books_id FROM history WHERE user_id = '${userId}' ORDER BY time desc limit 5`

					db.query(sql2, async (err, historyResults) => {
						if (err) {
							return res.status(500).json({
								statusCode: 'fail',
								message: err.message
							});
						}

						const idBook = historyResults.map(row => row.books_id);

						// const getBooks_id = await axios.post('link cloud run', {user_id: userId, books_id: idBook}) //blom fix

						// const booksID = getBooks_id.data.books_id
						
						await updateData(userId, idBook) //untuk testing
						// await updateData(userId, booksID)

						const gabungin = [...new Set([...book.data().rekomendasi, ...idBook])] //untuk testing
						// const gabungin = [...new Set([...book.data().rekomendasi, ...booksID])]

						// console.log("dari gabungin", gabungin) //untuk testing

						const query = `SELECT books_id, judul, image FROM books WHERE books_id in (?)`

						db.query(query, [gabungin], (err, fields) => {
							if (err) {
								return res.status(500).json({
									statusCode: 'fail',
									message: err.message
								});
							}

							return res.status(200).json({
								statusCode: 'success',
								message: 'Berhasil combine',
								data: fields
							});
						})
					});
				} else {
					const dataBook = book.data().rekomendasi

					// console.log("dari dataBook", dataBook);
					const query = `SELECT books_id, judul, image FROM books WHERE books_id in (?)`

					db.query(query, [dataBook], (err, fields) => {
						if (err) {
							return res.status(500).json({
								statusCode: 'fail',
								message: err.message
							});
						}

						return res.status(200).json({
							statusCode: 'success',
							message: 'Berhasil',
							data: fields
						});
					})
				}
			});
		} else {
			return res.status(400).json({
				statusCode: 'fail',
				message: 'Tidak ada preferensi',
			});
		}
	} catch (error) {
		return res.status(400).json({
			statusCode: 'fail',
			message: error.message,
		});
	}


}