import express from 'express';
import jwt from 'jsonwebtoken'
import AuthService from '../services/AuthService'
import config from '../config'
import LeagueService from '../services/LeagueService';

const router = express.Router();
const leagueService = new LeagueService();
const authService = new AuthService();
router.get('/espntest' , (req, res) => {
  console.log('testing')
  leagueService.getAPI('ESPN')
    .then(api => {
      console.log(api);
      return api.import()
    })
    .then(json => res.json(json))
    .catch(err => res.status(500).json({ERROR: 'ERRORR'}))
});

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