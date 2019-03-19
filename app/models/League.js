
export default class League {

    //TODO: REFACTOR TO BUILDER DESIGN PATTERN
    constructor(type, options = {}) {
        this.type = type;
        switch(type) {
            case 'espn':
                this.name = options.data.settings.name,
                this.id = options.data.id
                this.importBy = options.user;
                this.sport = options.sport;
                this.teams = options.teams;
                break;
            case 'cbs':
                this.name = options.details.leagueName;
                this.id = options.details.leagueId;
                this.importBy = options.user;
                this.sport = options.sport;
                this.teams = options.teams;
                break;
        }
    }
}