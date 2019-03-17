export default class League {

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
        }
    }
}