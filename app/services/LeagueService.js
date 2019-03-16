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
        return new Promise((resolve, reject) => {
        const api = getApi(type);
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
        console.log(`[LeagueService] - storing ${leagues.length} ${sport} leagues`);
        const leagues = profile.leagues[sport];
        leagues.forEach(async league => {
            await this.storeLeague(user, league, profile.type, sport);
            await this.updateUser(user, league, profile.type, sport);
        })
        return profile.leagues;
    }
    
    storeLeague(user, league, type, sport) {
        try {
            const metaId = league.meta.id.toString();
            const db = admin.firestore().collection(`leagues/${sport}/${type}`);
            const teams = league.teams.map(team => {

                const roster = team.roster.entries.map(player => {
                    const pmeta = player.playerPoolEntry.player;
                    return {
                        id: player.playerId,
                        firstName: pmeta.firstName,
                        lastName: pmeta.lastName,
                        fullName: pmeta.fullName
                    }
                });

                return { 
                    id: team.id,
                    location: team.location,
                    nickname: team.nickname,
                    owners: team.owners,
                    abbreviation: team.abbrev,
                    roster
                }
            });
            return db.doc(metaId).set({
                ts: admin.firestore.Timestamp.fromDate(new Date()),
                id: league.meta.id,
                name: league.meta.name,
                importBy: user,
                teams
            });  
        } catch (err) {
            return new Promise((resolve,reject) => reject(err));
        } 
    }

    updateUser(user, league, type, sport) {
        const db = admin.firestore().collection(`users/${user.toLowerCase()}/leagues/`);
        return db.doc(league.meta.id.toString()).set({
            ts: admin.firestore.Timestamp.fromDate(new Date()),
            leagueId: league.meta.id,
            teamId: league.team,
            ownerId: league.ownerId,
            sport,
            type
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

