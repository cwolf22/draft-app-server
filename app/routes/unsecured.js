import express from 'express';
import jwt from 'jsonwebtoken'
import AuthService from '../services/AuthService'
import config from '../config'

const router = express.Router();
const authService = new AuthService();

router.put('/register', (req, res) => {
    console.log(`Registering user: ${req.body.email}`);
    authService.register(req.body.email, req.body.password)
      .then(hash => {
        const token = jwt.sign({ email: req.body.email, hash }, config.secrets.JWT, { expiresIn: '24h' });
        res.json({data:{ token } });
      }).catch(err => res.status(500).json({error: err}));
});
router.post('/login', (req, res) => {
    console.log(`Login user: ${req.body.email}`);
    authService.login(req.body.email, req.body.password)
      .then(hash => {
        const token = jwt.sign({ email: req.body.email, hash }, config.secrets.JWT, { expiresIn: '24h' });
        res.json({data:{ token } });
      }).catch(err => res.status(err.status).json({error: err}));
})
export default router;