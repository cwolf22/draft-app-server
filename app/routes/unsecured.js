import express from 'express';
import AuthService from '../services/AuthService';
import LeagueService from '../services/LeagueService';
import DBConnector from '../services/DBConnector';
import ESPNTransactionService from '../services/ESPNTransactionService';
import GoogleSheetsAPI from '../services/api/GoogleSheetsAPI'
import config from '../config'

const router = express.Router();
const dbConnector = new DBConnector();
const leagueService = new LeagueService(dbConnector);
const authService = new AuthService(dbConnector);
const gsAPI = new GoogleSheetsAPI();

router.get('/test/:site/:sport', (req, res) => {
  console.log(`${req.params.site} ${req.params.sport} TEST`);
  const sport = req.params.sport
  const type = req.params.site;
  const username = type == 'espn' ? config.credentials.ESPN.username : config.credentials.CBS.username;
  const password = type == 'espn' ? config.credentials.ESPN.password : config.credentials.CBS.password;
  const member = type == 'espn' ? config.credentials.ESPN.member : config.credentials.CBS.member;

  leagueService.login(member, {username, password}, {type, sport})
    .then(profile => leagueService.loadLeagues(profile, {type, sport}))
    .then(profile => leagueService.storeLeagues(member, profile, sport))
    .then(profile => leagueService.mapLeagueResponse(profile))
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

router.get('/valid-transactions/:id/:tab', (req, res) => {
  console.log(`Test Transactions`);
  const tranService = new ESPNTransactionService(dbConnector);
  tranService.storePlayers()
    .then(() => tranService.getTransactions({type: 'espn', sport: 'baseball'}))
    .then(transactions => tranService.modelData(transactions))
    .then(async players => {
      const gdoc = await gsAPI.authorize(req.params.id);
      const rows = await gsAPI.getRows(gdoc,req.params.tab)
      return {players, rows}
    })
    .then(data => tranService.compareAndRespond(data.players, data.rows))
    .then(resp => res.json(resp))
    .catch(err => {
      res.status(500);
      if (err.status) res.status(err.status);
      const error = err.constructor == Array || err.constructor == String || err.constructor == Object ? err : {data:err}
      res.json(error)
    });
});

router.get('/sync/:sport', (req, res) => {
  console.log(`Sync Players: ${req.params.sport}`);
  const actions = ['cbs', 'espn'].map(site => {
    leagueService.login(null, null, site, req.params.sport);
  })
  Promise.all(actions)
    .then(data => res.json(data))
    .catch(err => {
      res.status(500);
      if (err.status) res.status(err.status);
      const error = err.constructor == Array || err.constructor == String || err.constructor == Object ? err : {data:err}
      res.json(error)
    });
});

export default router;