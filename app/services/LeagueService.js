import admin from 'firebase-admin'
import puppeteer from 'puppeteer'
import EspnProfile from '../models/EspnProfile'
import EspnAPI from './api/EspnAPI';

export default class LeagueService {
    static instance;

    constructor(dbConnector) {
        if (LeagueService.instance) return LeagueService.instance;

        this.dbConnector = dbConnector;
        LeagueService.instance = this;
    }

    login(uname, pass, type, sport) {
        console.log(`[LeagueService :: ${uname}] - ${type} login`)
        return new Promise((resolve, reject) => {
        const api = this.getApi(type);
        api.authorize(uname, pass)
            .then(profile => api.loadLeagues(profile, sport))
            .then(profile => resolve(profile))
            .catch(err => reject(err));
        });
    }

    getLeagues(user) {
        return new Promise((resolve, reject) => {
            console.log('[LeagueService] - get league for user')
            let leagues = [];
            this.dbConnector.getUserLeagues(user)
                .then(userLeagues => {
                    leagues = userLeagues;
                    const actions = userLeagues.map(league => this.dbConnector.getLeague(league) );
                    return Promise.all(actions);
                })
                .then(data => {
                    const result = data.map(league => {
                        const userLgInfo = leagues.find(l => l.leagueId == league.id);
                        return {
                          ...league,
                          type: userLgInfo.type,
                          sport: userLgInfo.sport,
                          teamId: userLgInfo.teamId,
                          ownerId: userLgInfo.ownerId
                        }
                    });
                    resolve(result);
                })
                .catch(err => reject(err));
        });
    }

    storeLeagues(user, profile, sport) {
        console.log(`[LeagueService :: ${user}] - storing ${profile.leagues.length} ${sport} leagues`);
        return new Promise((resolve, reject) => {
            profile.leagues.forEach(async league => {
                try {
                    await this.dbConnector.storeLeague(league);
                    const details = profile.playerDetails.find(pd => league.id == pd.leagueId);
                    await this.dbConnector.storeUserDetails(user, details);
                    resolve(profile.leagues);
                } catch (err) {
                    reject(err);
                }
            })
        });
    }

    /*******************
     * P R I V A T E
     */

    getApi(type) {
        switch(type) {
            case 'espn':
                return new EspnAPI();
            case 'cbs':
                return new CbsAPI();
            default:
                return null;
        }
    }
}

