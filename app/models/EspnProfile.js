export default class EspnProfile {
    constructor(user, cookies = [], freshLogin = true) {
        this.freshLogin = true;
        this.type = 'espn';
        this.user = user;
        this.cookies = {
            swid: cookies.find(c => c.name == 'SWID'),
            espn_s2: cookies.find(c => c.name == 'espn_s2')
        }
        this.leagues = [];
        this.playerDetails = [];
    }

    getCookieString() {
        return `${this.cookies.swid.name}=${this.cookies.swid.value}; ${this.cookies.espn_s2.name}=${this.cookies.espn_s2.value}`
    }
}