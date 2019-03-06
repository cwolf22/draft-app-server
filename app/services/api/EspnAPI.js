class EspnAPI {
    constructor() {
        this.baseUri = `http://fantasy.espn.com/apis/v3/games/flb/seasons/${new Date().getFullYear()}/segments/0/leagues/`;
    }

    getRoster(teamId, leagueId) {
        const uri = `${this.baseUri}${leagueId}?forTeamId=${teamId}&view=mRoster`
    }
    
}