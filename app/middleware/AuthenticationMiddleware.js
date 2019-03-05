import jwt from 'jsonwebtoken'

let checkToken = (req, res, next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

    console.log(`Token: ${token}`)
    if (!token) {
        return res.json({
            success: false,
            message: 'Auth token is not supplied'
        });
    }
    //MOVE AWAY SECRET
    jwt.verify(token, 'config-secret', (err, decoded) => {
        if (err) {
          return res.json({
            success: false,
            message: 'Token is not valid'
          });
        }
        req.decoded = decoded;
        next();
    });
  };
  
  module.exports = {
    checkToken: checkToken
  }