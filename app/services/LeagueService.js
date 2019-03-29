import EspnAPI from './api/EspnAPI';
import CbsAPI from './api/CbsAPI';

export default class LeagueService {
    static instance;

    constructor(dbConnector) {
        if (LeagueService.instance) return LeagueService.instance;

        this.dbConnector = dbConnector;
        LeagueService.instance = this;
    }

    async login(member, credentials, meta) {
        console.log(`[LeagueService :: ${member}] - ${meta.type} login`)
        const api = this.getApi(meta.type);
        return await api.authorize(member, credentials, { sport: meta.sport, dbConnector: this.dbConnector });
    }

    async loadLeagues(profile, meta) {
        console.log(`[LeagueService] - Load Leagues login`)
        const api = this.getApi(meta.type);
        return await api.loadLeagues(profile, meta.sport);
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
                    league.ts = this.dbConnector.getTimestamp();
                    await this.dbConnector.storeLeague(league);
                    const details = profile.playerDetails.find(pd => league.id == pd.leagueId);
                    await this.dbConnector.storeUserDetails(user, details);
                } catch (err) {
                    reject(err);
                }
            })
            resolve(profile);
        });
    }

    mapLeagueResponse(profile) {
        console.log(`[LeagueService :: ${profile.user}] - map leagues reponse`);
        return new Promise((resolve, reject) => {
            const response = profile.leagues.map(league => {
                const userLgInfo = profile.playerDetails.find(details => details.leagueId == league.id);
                return {
                  ...league,
                  type: userLgInfo.type,
                  sport: userLgInfo.sport,
                  teamId: userLgInfo.teamId,
                  ownerId: userLgInfo.ownerId
                }
            });
            resolve(response);
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

