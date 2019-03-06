import express from 'express';
import LeagueService from '../../services/LeagueService';

const router = express.Router();
const leagueService = new LeagueService();

router.get('/:email', (req, res) => {
  console.log("getting leagues");
});
router.put('/:email', (req, res) => {
  console.log("adding league");
  leagueService.getApi(req.body.type, req.body.sport)
    //.then(api => api.connect(req.body))
    .then(leagueService.store(req.body))
    .then(resp => res.json(resp))
    .catch(err => res.status(err.status).json(err));
});
router.get('/:sport/:id', (req, res) => {
    
});

export default router;