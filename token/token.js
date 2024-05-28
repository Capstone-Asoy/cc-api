const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi token
function cekToken(req, res, next) {
    const {authorization} = req.headers; // ngambil dari header Authorization

    if (!authorization) {
        return res.status(403).send({ auth: false, message: 'Token dibutuhkan.' });
    }

    const token = authorization.split(' ')[1]

    // try {
    //     const jwtDecode = jwt.verify(token, 'jwtrahasia')
        
    // } catch (error) {
        
    // }

    jwt.verify(token, 'jwtrahasia', (err, decoded) => {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Gagal authenticate token.', error: err.message });
        }

        req.userId = decoded.id; // menyimpan userID dari token ke dalam request
        req.name = decoded.name
        req.email = decoded.email
        next(); // ke handler berikutnya
    });
}

module.exports = cekToken;
