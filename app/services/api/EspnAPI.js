import HTTPService from '../HTTPService'
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
    constructor() {
        if (EspnAPI.instance) return EspnAPI.instance;
        EspnAPI.instance = this;
    }

    authorize(user, pass) {
        console.log(`[espn api] - loginUser ${user} : get login form...`);
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
                        console.log('[espn] - Submitting Form...');
                        await Promise.all([
                            myframe.click(EspnAPI.login.submitSelector, {waitUntil : 'networkidle0'}),
                            page.waitForNavigation( {timeout: 30000 }),
                        ]);
                    } catch (err) {
                        console.log('[espn] - Login Failure');
                        reject(err);
                        return;
                    }
                    try {
                        const cookies = await page.cookies();
                        console.log(`[espn] - Login Successful. Returning ${cookies.length} cookies`);
                        const profile = new EspnProfile(user, cookies);
                        if (!profile.isAuthenticated) throw `[espn] - Unable to Authenticate ${user} through API`
                        resolve(profile)
                    } catch (err) {
                        console.log('[espn] - Failure Fetching User Data');
                        console.log(err);
                        reject(err);
                    }
                } finally {
                    console.log('close browser')
                    await browser.close();
                }
            });
        });
    }

    loadLeagues(profile, sport) {
        console.log(`[espn api] - loading profile from cookies`);
        return new Promise((resolve, reject) => {
            if (!this.isAuthenticated()) {
                reject("User Unauthenticated");
                return;
            }
            const url = `${EspnAPI.urls.v2_fan.base}${profile.cookies.swid.value}?${EspnAPI.urls.v2_fan.params}`;
            axios.get(url, { headers: { Cookie: profile.getCookieString()}})
                .then(response => {
                    this.parseResponse(profile, response.data, sport)
                        .then((leagues) => {
                            profile.leagues[sport] = leagues;
                            console.log(leagues);
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

    parseResponse(profile, json = { preferences: []}, sport) {
        const abbrev = EspnAPI.sportMapping[sport];
        console.log(`Parse response for and find sports ${abbrev}`)
        return new Promise((resolve, reject) => {
            const actions = json.preferences.filter(obj => obj.metaData.entry.abbrev == abbrev)
                .map(resp => {
                    const entry = resp.metaData.entry;
                    const url = `${EspnAPI.urls.v3.base}${entry.groups[0].groupId}?${EspnAPI.urls.v3.params}`;
                    console.log(`making league request: ${url}`)
                    return axios.get(url, { headers: { 
                        Cookie: profile.getCookieString()},
                        teamId: entry.entryId
                    });
                })
            Promise.all(actions).then(arr => {
                const leagues = arr.map(response => {
                    const teams = response.data.teams.map(team => {
                        const owners = team.owners.map(ownerId => response.data.members.find(member => ownerId == member.id));    
                        team.owners = owners;
                        return team;
                    });
                    return new League(this.type, { data: response.data, config: response.config, ownerId, teams, user: profile.user });
                });
                resolve(leagues);
            });
        });
    }
}