import express from 'express';
import AuthService from '../services/AuthService';
import DBConnector from '../services/DBConnector';

const router = express.Router();
const dbConnector = new DBConnector();
const authService = new AuthService(dbConnector);

router.put('/register', (req, res) => {
    console.log(`Registering user: ${req.body.email}`);
    authService.register(req.body.email, req.body.password)
      .then(hash => {
        const token = authService.generateToken(req.body.email, hash);
        res.json({data:{ token } })
      })
      .catch(err => res.status(500).json({error: err}));
});

router.post('/login', (req, res) => {
    console.log(`Login user: ${req.body.email}`);
    authService.login(req.body.email, req.body.password)
      .then(hash => {
        console.log(`hash: ${hash}`)
        const token = authService.generateToken(req.body.email, hash);
        console.log(token)
        res.json({data:{ token } })
      })
      .catch(err => res.status(err.status).json({error: err}));
});

export default router;