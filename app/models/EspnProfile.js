import axios from 'axios';

export default class EspnProfile {

    //http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/<LEAGUE_ID>?view=mRoster
    //http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/2136?view=mRoster&view=modular&view=mNav
    static urls = {
        v3: { 
            base: `http://fantasy.espn.com/apis/v3/games/flb/seasons/${new Date().getFullYear()}/segments/0/leagues/`,
            params: 'view=mRoster&view=modular&view=mNav'
        },
        v2_fan: { 
            base: `https://fan.api.espn.com/apis/v2/fans/`,
            params: 'displayEvents=true&displayNow=true&displayRecs=true&recLimit=5&userId=%7BB89096F2-E5B9-4541-A5E3-6BC80F22D56E%7D&context=fantasy&source=espncom-fantasy&lang=en&section=espn&region=us'
        }
    }
    static sportMapping = {
        baseball: 'FLB',
        football: 'FLL'
    }

    constructor(user, cookies = {}) {
        this.type = 'espn';
        this.user = user;
        this.cookies = {
            swid: cookies.find(c => c.name == 'SWID'),
            espn_s2: cookies.find(c => c.name == 'espn_s2')
        }
        this.leagues = []
    }

    getCookieString() {
        return `${this.cookies.swid.name}=${this.cookies.swid.value}; ${this.cookies.espn_s2.name}=${this.cookies.espn_s2.value}`
    }

    /****************
     * P R I V A T E
     */

    isAuthenticated() {
        return (this.cookies.swid && this.cookies.espn_s2)
    }
}