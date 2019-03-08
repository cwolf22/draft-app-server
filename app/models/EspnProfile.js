import axios from 'axios';

export default class EspnProfile {

    //http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/<LEAGUE_ID>?view=mRoster
    static urls = {
        v3: { base: `http://fantasy.espn.com/apis/v3/games/flb/seasons/${new Date().getFullYear()}/segments/0/leagues/` },
        v2_fan: { 
            base: `https://fan.api.espn.com/apis/v2/fans/`,
            params: `displayEvents=true&displayNow=true&displayRecs=true&recLimit=5&userId=%7BB89096F2-E5B9-4541-A5E3-6BC80F22D56E%7D&context=fantasy&source=espncom-fantasy&lang=en&section=espn&region=us`
        }
    }
    static sportMapping = {
        baseball: 'FLB',
        football: 'FLL'
    }

    constructor(_cookies = {}) {
        this.cookies = {
            swid: _cookies.find(c => c.name == 'SWID'),
            espn_s2: _cookies.find(c => c.name == 'espn_s2')
        }
        this.leagues = {}
    }

    load(sport) {
        console.log(`[espn api] - loading profile from cookies`);
        return new Promise((resolve, reject) => {
            if (!this.isAuthenticated) {
                reject("User Unauthenticated");
                return;
            }
            const url = `${EspnProfile.urls.v2_fan.base}${this.cookies.swid.value}?${EspnProfile.urls.v2_fan.params}`;
            axios.get(url, { headers: { Cookie: `${this.cookies.swid.name}=${this.cookies.swid.value}; ${this.cookies.espn_s2.name}=${this.cookies.espn_s2.value}`}})
                .then(response => {
                    this.parseResponse(response.data, sport)
                        .then((profile) => resolve(profile))
                        .catch(err => {throw err})
                })
                .catch(error => {
                    console.log(error);
                    reject(error);
                });
        });
    }

    parseResponse(json = { preferences: []}, sport) {
        const abbrev = EspnProfile.sportMapping[sport];
        console.log(`Parse response for and find sports ${abbrev}`)
        return new Promise((resolve, reject) => {
            const actions = json.preferences.filter(obj => obj.metaData.entry.abbrev == abbrev)
                .map(resp => {
                    const entry = resp.metaData.entry;
                    const url = `${EspnProfile.urls.v3.base}${entry.groups[0].groupId}?view=mRoster`;
                    console.log(`making league request: ${url}`)
                    return axios.get(url, { headers: { 
                        Cookie: `${this.cookies.swid.name}=${this.cookies.swid.value}; ${this.cookies.espn_s2.name}=${this.cookies.espn_s2.value}`},
                        teamId: entry.entryId,
                        teamName: `${entry.entryLocation} ${entry.entryNickname}`,
                        leagueId: entry.groups[0].groupId,
                        leagueName: entry.groups[0].groupName
                    });
                })
            Promise.all(actions).then(arr => {
                const leagues = arr.map(response => {
                    const config = response.config
                    return {
                        meta: {
                            id: config.leagueId,
                            name: config.leagueName
                        },
                        team: {
                            id: config.teamId,
                            name: config.teamName
                        },
                        teams: response.data.teams
                    }
                });
                this.leagues[sport] = leagues;
                resolve(this);
            });
        });
    }

    collectLeagus() {

    }

    isAuthenticated() {
        return (!this.cookies.swid || !this.cookies.espn_s2)
    }
}