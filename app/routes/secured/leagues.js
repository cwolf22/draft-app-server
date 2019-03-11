import express from 'express';
import LeagueService from '../../services/LeagueService';

const router = express.Router();
const leagueService = new LeagueService();

router.get('/:user' , (req, res) => {
  console.log(`Get leagues for user: ${req.params.user}`)
  leagueService.getLeagues(req.params.user)
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ERROR: err}))
});

router.post('/:user/:sport', (req, res) => {
  console.log(`Import: [${req.params.user}] - ${req.params.sport}`)
  const sport = req.body.sport.toLowerCase();
  const type = req.body.type.toLowerCase();
  leagueService.login(req.params.user, req.body.username, req.body.password, type, sport)
    .then(profile => leagueService.storeLeagues(req.params.user, profile, type, sport))
    .then(league => res.json(league))
    .catch(err => res.status(500).json({ERROR: err}))
});
router.get('/users/:user', (req, res) => {
  console.log("getting leagues");
});

export default router;