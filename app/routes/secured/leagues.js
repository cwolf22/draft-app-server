import express from 'express';
import LeagueService from '../../services/LeagueService';

const router = express.Router();
const leagueService = new LeagueService();

router.put('/:user/:sport', (req, res) => {
  console.log("adding league");
  leagueService.login('cliffhanger178', 'hilliard1','ESPN')
    //.then(profile => res.json(profile.leagues))
    .then(profile => LeagueService.storeLeagues(profile))
    .then(league => res.json(league))
    .catch(err => res.status(500).json({ERROR: err}))
});
router.get('/users/:user', (req, res) => {
  console.log("getting leagues");
});
router.get('/:sport/:id', (req, res) => {
    
});

export default router;