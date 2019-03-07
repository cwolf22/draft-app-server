import HTTPService from '../HTTPService'
import puppeteer from 'puppeteer';
import axios from 'axios';
import EspnProfile from '../../models/EspnProfile';

export default class EspnAPI {
    constructor() {
        this.login = {
            page: 'https://www.espn.com/login/',
            iframeDomain: 'registerdisney.go.com',
            emailSelector: 'form input[type="email"]',
            passwordSelector: 'form input[type="password"]',
            submitSelector: 'form button[type="submit"]'
        }
        this.baseUri = `http://fantasy.espn.com/apis/v3/games/flb/seasons/${new Date().getFullYear()}/segments/0/leagues/`;
        this.userUri = `https://fan.api.espn.com/apis/v2/fans/`
        this.userUriParams = `displayEvents=true&displayNow=true&displayRecs=true&recLimit=5&userId=%7BB89096F2-E5B9-4541-A5E3-6BC80F22D56E%7D&context=fantasy&source=espncom-fantasy&lang=en&section=espn&region=us`
    }

    import(sport) {
        return new Promise((resolve, reject) => {
            this.loginUser('cliffhanger178', 'hilliard1')
                .then(cookies => this.loadProfile(cookies))
                .then(profile => this.loadLeagues(profile, sport))
                .then(data => resolve(data))
                .catch(err => reject(err));
        });
    }

    loginUser(uname, pass) {
        console.log(`[espn api] - loginUser ${uname}`);
        return new Promise((resolve, reject) => {
            puppeteer.launch().then(async browser => {
                const page = await browser.newPage();
                try {
                    await page.goto(this.login.page, {waitUntil : 'networkidle0'});
                    const frames = await page.frames();
                    const myframe = frames.find(f => f.url().indexOf(this.login.iframeDomain) > 0);
                    const email = await myframe.$(this.login.emailSelector);
                    const password = await myframe.$(this.login.passwordSelector);
                    await email.type(uname)
                    await password.type(pass)
                    console.log('[espn api] - Submitting Form');
                    await Promise.all([
                        myframe.click(this.login.submitSelector, {waitUntil : 'networkidle0'}),
                        page.waitForNavigation( {timeout: 10000 }),
                    ]);
                } catch (err) {
                    console.log('[espn api] - Login Failure');
                    console.log(err);
                    reject(err);
                    return;
                }
                try {
                    const cookies = await page.cookies();
                    console.log(`[espn api] - Login Successful. Returning ${cookies.length} cookies`);
                    const profile = new EspnProfile(cookies);
                    if (!profile.isAuthenticated) throw `[espn api] - Unable to Authenticate ${uname} through API`
                    resolve(profile)
                } catch (err) {
                    console.log('[espn api] - Failure Fetching User Data');
                    console.log(err);
                    reject(err);
                }
            });
        });
    }

    loadProfile(cookies = []) {
        console.log(`[espn api] - loading profile from cookies`);
        return new Promise((resolve, reject) => {
            const swid = cookies.find(c => c.name == 'SWID');
            const espn_s2 = cookies.find(c => c.name == 'espn_s2');
            

            const
            var url = `${this.userUri}${swid.value}?${this.userUriParams}`;
            axios.get(url, { headers: { Cookie: `${swid.name}=${swid.value}; ${espn_s2.name}=${espn_s2.value}`}})
                .then(response => resolve(new EspnProfile(swid, espn_s2, data.response)))
                .catch(error => {
                    console.log(error);
                    reject(error);
                })
        });
    }

    loadLeagues(profile, sport) {
        console.log(`[espn api] - loading leagues`);

    }

    getRoster(teamId, leagueId) {
        const uri = `${this.baseUri}${leagueId}?forTeamId=${teamId}&view=mRoster`
        return new Promise((resolve, reject) => {
            HTTPService.action('GET', uri)
                .then(response => response.data)
                .then(data => resolve(data))
                .catch(err => reject(err))
        });
    }

    getLeague(leagueId) {
        return new Promise((resolve, reject) => {
            this.getLeagueInfo(leagueId)
                .then(info => {
                    let payload = { info }
                    this.getLeagueRosters(leagueId)
                        .then(roster => payload.roster = roster);
                    return payload;
                })
                .then(payload =>resolve(payload))
                .catch(err => reject(err))
        });
    }

    getLeagueRosters(leagueId) {
        const uri = `${this.baseUri}${leagueId}?view=mRoster`
        return new Promise((resolve, reject) => {
            HTTPService.action('GET', uri)
                .then(response => response.data)
                .then(data => resolve(data))
                .catch(err => reject(err))
        });
    }

    getLeagueInfo(leagueId) {
        const uri = `${this.baseUri}${leagueId}`
        return new Promise((resolve, reject) => {
            HTTPService.action('GET', uri)
                .then(response => response.data)
                .then(data => resolve(data))
                .catch(err => reject(err))
        });
    }
    
}