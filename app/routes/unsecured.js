import express from 'express';
import AuthService from '../services/AuthService';
import LeagueService from '../services/LeagueService';
import DBConnector from '../services/DBConnector';
import ESPNTransactionService from '../services/ESPNTransactionService';
import GoogleSheetsAPI from '../services/api/GoogleSheetsAPI'

const router = express.Router();
const dbConnector = new DBConnector();
const leagueService = new LeagueService(dbConnector);
const authService = new AuthService(dbConnector);
const gsAPI = new GoogleSheetsAPI();
/*
router.get('/cbstest', (req, res) => {
  console.log('CBS TEST');
  const sport = 'baseball'
  const type = 'espn'
  const username = 'cliffhanger178';
  const password = ''
  leagueService.login(username, password, type, sport)
    .then(profile => leagueService.storeLeagues('chriswolf@fastmail.com', profile, sport))
    .then(profile => leagueService.mapLeagueResponse(profile))
    .then(data => res.json(data))
    .catch(err => {
      console.log(err)
      res.status(500).json({ERROR: err})}
      );
});
*/

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

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
  const tranService = new ESPNTransactionService();
  tranService.storePlayers()
    .then(() => tranService.getTransactions())
    .then(transactions => tranService.modelData(transactions))
    .then(async players => {
      const gdoc = await gsAPI.authorize(req.params.id);
      const rows = await gsAPI.getRows(gdoc,req.params.tab)
      return {players, rows}
    })
    .then(data => tranService.compareAndRepsond(data.players, data.rows))
    .then(resp => res.json(resp))
    .catch(err => {
      res.status(500);
      if (err.status) res.status(err.status);
      const error = err.constructor == Array || err.constructor == String || err.constructor == Object ? err : {data:err}
      res.json(error)
    });
});

export default router;