import jwt from 'jsonwebtoken'
import config from '../config'

export default (req, res, next) => {
  console.log('Executing Auth Middleware');
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token.startsWith('Bearer ')) token = token.slice(7, token.length);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Auth token is not supplied'
        });
    }
    jwt.verify(token, config.secrets.JWT, (err, decoded) => {
        if (err) {
          return res.status(401).json({
            success: false,
            message: 'Token is not valid'
          });
        }
        req.decoded = decoded;
        next();
    });
  };
