import express from 'express';
import jwt from 'jsonwebtoken'
import AuthService from '../services/AuthService'
import config from '../config'
import LeagueService from '../services/LeagueService';

const router = express.Router();
const leagueService = new LeagueService();
const authService = new AuthService();

router.get('/espntest' , (req, res) => {
  console.log('espntest')
  const sport = 'baseball'
  const type = 'ESPN'
  const user = 'chriswolf@fastmail.com'
  leagueService.login('cliffhanger178', 'hilliard1', type, sport)
    //.then(profile => res.json(profile.leagues))
    .then(profile => leagueService.storeLeagues(user, profile, type, sport))
    .then(league => res.json(league))
    .catch(err => res.status(500).json({ERROR: err}))
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