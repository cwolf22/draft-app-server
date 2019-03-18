import puppeteer from 'puppeteer';
import axios from 'axios';
import EspnProfile from '../../models/EspnProfile';
import League from '../../models/League';

export default class EspnAPI {
    static instance;

    static login = {
        page: 'https://www.espn.com/login/',
        iframeDomain: 'registerdisney.go.com',
        emailSelector: 'form input[type="email"]',
        passwordSelector: 'form input[type="password"]',
        submitSelector: 'form button[type="submit"]'
    }
    //http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/<LEAGUE_ID>?view=mRoster
    //http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/2136?view=mRoster&view=modular&view=mNav
    static api = {
        v3: { 
            base: `http://fantasy.espn.com/apis/v3/games/flb/seasons/${new Date().getFullYear()}/segments/0/leagues/`,
            params: 'view=mRoster&view=modular&view=mNav'
        },
        v2_fan: { 
            base: `https://fan.api.espn.com/apis/v2/fans/`,
            //why is userid in this parameter
            params: 'displayEvents=true&displayNow=true&displayRecs=true&recLimit=5&userId=%7BB89096F2-E5B9-4541-A5E3-6BC80F22D56E%7D&context=fantasy&source=espncom-fantasy&lang=en&section=espn&region=us'
        }
    }
    static sportMapping = {
        baseball: 'FLB',
        football: 'FLL'
    }

    constructor() {
        if (EspnAPI.instance) return EspnAPI.instance;
        EspnAPI.instance = this;
    }

    authorize(user, pass, options = {}) {
        console.log(`[espn api] - authorize ${user} : get login form...`);
        return new Promise((resolve, reject) => { 
            puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}).then(async browser => {
                try {
                    const page = await browser.newPage();
                    try {
                        await page.goto(EspnAPI.login.page, {waitUntil : 'networkidle0'});
                        const frames = await page.frames();
                        const myframe = frames.find(f => f.url().indexOf(EspnAPI.login.iframeDomain) > 0);
                        const email = await myframe.$(EspnAPI.login.emailSelector);
                        const password = await myframe.$(EspnAPI.login.passwordSelector);
                        await email.type(user)
                        await password.type(pass)
                        console.log('[espn api] - Submitting Form...');
                        await Promise.all([
                            myframe.click(EspnAPI.login.submitSelector, {waitUntil : 'networkidle0'}),
                            page.waitForNavigation( {timeout: 30000 }),
                        ]);
                    } catch (err) {
                        console.log('[espn api] - Login Failure');
                        reject(err);
                        return;
                    }
                    try {
                        const cookies = await page.cookies();
                        console.log(`[espn api] - Login Successful. Returning ${cookies.length} cookies`);
                        const profile = new EspnProfile(user, cookies);
                        if (!profile.isAuthenticated()) throw `[espn api] - Unable to Authenticate ${user} through API`
                        resolve(profile);
                    } catch (err) {
                        console.log('[espn api] - Failure Fetching User Data');
                        console.log(err);
                        reject(err);
                    }
                } finally {
                    console.log('[espn api] - close browser')
                    await browser.close();
                }
            });
        });
    }

    loadLeagues(profile, sport) {
        console.log(`[espn api] - loading ${sport} leagues from cookies`);
        return new Promise((resolve, reject) => {
            if (!profile.isAuthenticated()) {
                reject("User Unauthenticated");
                return;
            }
            const url = `${EspnAPI.api.v2_fan.base}${profile.cookies.swid.value}?${EspnAPI.api.v2_fan.params}`;
            console.log(`[espn api] - making request for fan data: ${url}`)
            axios.get(url, { headers: { Cookie: profile.getCookieString()}})
                .then(response => {
                    this.parseResponse(profile, response.data, sport)
                        .then((leagues) => {
                            profile.leagues = leagues;
                            resolve(profile);
                        })
                        .catch(err => {throw err})
                })
                .catch(error => {
                    console.log(error);
                    reject(error);
                });
        });
    }

    //TODO: Clean this up
    parseResponse(profile, json = { preferences: []}, sport) {
        const abbrev = EspnAPI.sportMapping[sport];
        console.log(`[espn api] - Parse response for and find sports ${abbrev}`)
        return new Promise((resolve, reject) => {
            const actions = json.preferences.filter(obj => obj.metaData.entry.abbrev == abbrev)
                .map(resp => {
                    const entry = resp.metaData.entry;
                    profile.playerDetails.push({
                        leagueId: entry.groups[0].groupId,
                        ownerId: profile.cookies.swid.value,
                        type: profile.type,
                        teamId: entry.entryId,
                        sport   
                    })
                    const url = `${EspnAPI.api.v3.base}${entry.groups[0].groupId}?${EspnAPI.api.v3.params}`;
                    console.log(`[espn api] - making league request: ${url}`)
                    return axios.get(url, { headers: { Cookie: profile.getCookieString()}});
                })
            Promise.all(actions).then(arr => {
                const leagues = arr.map(response => {
                    const teams = response.data.teams.map(team => this.mapTeamData(team, response.data.members));
                    return new League(profile.type, { 
                        data: response.data, 
                        user: profile.user,
                        teams, 
                        sport 
                    });
                });
                resolve(leagues);
            });
        });
    }

    mapTeamData(team, members) {
            const owners = team.owners.map(ownerId => members.find(member => ownerId == member.id));    
            const roster = team.roster.entries.map(player => {
                const pmeta = player.playerPoolEntry.player;
                return {
                    id: player.playerId,
                    firstName: pmeta.firstName,
                    lastName: pmeta.lastName,
                    fullName: pmeta.fullName
                }
            });
            team.owners = owners;
            team.roster = roster;
            return team;
    }
}