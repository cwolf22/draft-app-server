import express from 'express';
import AuthService from '../services/AuthService';
import LeagueService from '../services/LeagueService';
import DBConnector from '../services/DBConnector';

const router = express.Router();
const dbConnector = new DBConnector();
const leagueService = new LeagueService(dbConnector);
const authService = new AuthService(dbConnector);

router.get('/cbstest', (req, res) => {
  console.log('CBS TEST');
  const sport = 'football'
  const type = 'cbs'
  const username = 'soadsmack178';
  const password = ''
  leagueService.login(username, password, type, sport)
    .then(profile => leagueService.storeLeagues('chriswolf@fastmail.com', profile, sport))
    .then(data => res.json(data))
    .catch(err => {
      console.log(err)
      res.status(500).json({ERROR: err})}
      );
});

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