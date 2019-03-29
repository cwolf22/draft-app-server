import express from 'express';
import LeagueService from '../../services/LeagueService';
import DBConnector from '../../services/DBConnector';

const router = express.Router();
const dbConnector = new DBConnector();
const leagueService = new LeagueService(dbConnector);

router.get('/:user' , (req, res) => {
  console.log(`Get leagues for user: ${req.params.user}`)
  leagueService.getLeagues(req.params.user)
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ERROR: err}))
});

router.post('/:user/:sport', (req, res) => {
  console.log(`Import: [${req.params.user}] - ${req.params.sport}`)
  const meta = {
    sport: req.body.sport.toLowerCase(),
    type: req.body.type.toLowerCase()
  }
  leagueService.login(req.params.user, {username: req.body.username, password: req.body.password}, meta)
    .then(profile => leagueService.loadLeagues(profile, meta))
    .then(profile => leagueService.storeLeagues(member, profile, meta.sport))
    .then(profile => leagueService.mapLeagueResponse(profile))
    .then(data => res.json(data))
    .catch(err => {
      console.log(err);
      res.status(500).json({ERROR: err});
    });
});

export default router;