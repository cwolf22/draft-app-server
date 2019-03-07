import axios from 'axios';

export default class EspnProfile {

    static urls = {
        v3: { base: `http://fantasy.espn.com/apis/v3/games/flb/seasons/${new Date().getFullYear()}/segments/0/leagues/` },
        v2_fan: { 
            base: `https://fan.api.espn.com/apis/v2/fans/`,
            params: `displayEvents=true&displayNow=true&displayRecs=true&recLimit=5&userId=%7BB89096F2-E5B9-4541-A5E3-6BC80F22D56E%7D&context=fantasy&source=espncom-fantasy&lang=en&section=espn&region=us`
        }
    }

    constructor(_cookies = {}) {
        this.cookies = {
            swid: _cookies.find(c => c.name == 'SWID'),
            espn_s2: _cookies.find(c => c.name == 'espn_s2')
        }
        this.leagues = {}
    }

    load() {
        console.log(`[espn api] - loading profile from cookies`);
        return new Promise((resolve, reject) => {
            if (!this.isAuthenticated) {
                reject("User Unauthenticated");
                return;
            }
            const url = `${EspnProfile.urls.v2_fan.base}${this.cookies.swid.value}?${EspnProfile.urls.v2_fan.params}`;
            axios.get(url, { headers: { Cookie: `${this.cookies.swid.name}=${this.cookies.swid.value}; ${this.cookies.espn_s2.name}=${this.cookies.espn_s2.value}`}})
                .then(response => {
                    this.parseResponse(response.data)
                    resolve(this)
                })
                .catch(error => {
                    console.log(error);
                    reject(error);
                });
        });
    }

    parseResponse(json = { preferences: []}) {
        console.log('parsing json')
        json.preferences
        this.leagues = json
    }

    collectLeagus() {

    }

    isAuthenticated() {
        return (!this.cookies.swid || !this.cookies.espn_s2)
    }
}