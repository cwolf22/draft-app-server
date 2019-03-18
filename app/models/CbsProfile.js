export default class CbsProfile {
    constructor(user, tokens = []) {
        this.type = 'cbs';
        this.user = user;
        this.tokens = tokens;
        this.leagues = [];
        this.playerDetails = [];
    }
}