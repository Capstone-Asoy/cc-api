const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi token
function cekToken(req, res, next) {
    const {authorization} = req.headers; // ngambil dari header Authorization

    if (!authorization) {
        req.terautentikasi = false
        return res.status(403).json({ statusCode: 'fail', message: 'Autentikasi dibutuhkan' });
    }

    const token = authorization.split(' ')[1]

    // try {
    //     const jwtDecode = jwt.verify(token, 'jwtrahasia')
        
    // } catch (error) {
        
    // }

    jwt.verify(token, 'jwtrahasia', (err, decoded) => {
        if (err) {
            return res.status(500).json({ statusCode: 'fail', message: 'Gagal authenticate token.', error: err.message });
        }

        req.terautentikasi = true
        req.userId = decoded.id; 
        req.name = decoded.name
        req.email = decoded.email
        next(); 
    });
}

module.exports = cekToken;
