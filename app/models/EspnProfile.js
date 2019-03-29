export default class EspnProfile {

    static authCookies = ['SWID','espn_s2'];
    
    constructor(user, cookies = [], freshLogin = true) {
        this.freshLogin = true;
        this.type = 'espn';
        this.user = user;
        this.cookies = EspnProfile.authCookies.map(cname => cookies.find(c => c.name == cname));
        this.leagues = [];
        this.playerDetails = [];
    }

    getSWID() {
        const cookie = this.cookies.find(c => c.name == 'SWID');
        return cookie.value;
    }

    getCookieString() {
        const cookieArr = this.cookies.map(cookie => `${cookie.name}=${cookie.value}`);
        return cookieArr.join('; ');
    }
}