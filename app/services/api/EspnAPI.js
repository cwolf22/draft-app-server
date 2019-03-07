import HTTPService from '../HTTPService'

class EspnAPI {
    constructor() {
        this.baseUri = `http://fantasy.espn.com/apis/v3/games/flb/seasons/${new Date().getFullYear()}/segments/0/leagues/`;
    }

    getRoster(teamId, leagueId) {
        const uri = `${this.baseUri}${leagueId}?forTeamId=${teamId}&view=mRoster`
        return new Promise((resolve, reject) => {
            HTTPService.action('GET', uri)
                .then(response => response.data)
                .then(data => resolve(data))
                .catch(err => reject(err))
        });
    }

    getLeague(leagueId) {
        return new Promise((resolve, reject) => {
            this.getLeagueInfo(leagueId)
                .then(info => {
                    let payload = { info }
                    this.getLeagueRosters(leagueId)
                        .then(roster => payload.roster = roster);
                    return payload;
                })
                .then(payload =>resolve(payload))
                .catch(err => reject(err))
        });
    }

    getLeagueRosters(leagueId) {
        const uri = `${this.baseUri}${leagueId}?view=mRoster`
        return new Promise((resolve, reject) => {
            HTTPService.action('GET', uri)
                .then(response => response.data)
                .then(data => resolve(data))
                .catch(err => reject(err))
        });
    }

    getLeagueInfo(leagueId) {
        const uri = `${this.baseUri}${leagueId}`
        return new Promise((resolve, reject) => {
            HTTPService.action('GET', uri)
                .then(response => response.data)
                .then(data => resolve(data))
                .catch(err => reject(err))
        });
    }
    
}