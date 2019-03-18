import puppeteer from 'puppeteer';
import axios from 'axios'
import CbsProfile from "../../models/CbsProfile";
import League from '../../models/League';

export default class CbsAPI {
    static instance;

    static login = {
        page: 'https://www.cbssports.com/login',
        params: 'xurl=https://www.cbssports.com/fantasy/games/my-teams/',
        userSelector: '#userid',
        passwordSelector: '#password',
        form: '#login_form'
    }

    static teams = {
        waitSelector: 'div.my-teams',
        prefixSelector: 'ul#team-',
        suffixSelector: ' > li .user-teams > a'
    }

    static api = {
        params: 'version=3.0&response_format=json',
        teams: 'http://api.cbssports.com/fantasy/league/teams',
        rosters: 'http://api.cbssports.com/fantasy/league/rosters',
        owners: 'http://api.cbssports.com/fantasy/league/owners'
    }
    static sportMapping = {
        baseball: 'sports-baseball',
        football: 'sports-football'
    }

    constructor() {
        if (CbsAPI.instance) return CbsAPI.instance;
        CbsAPI.instance = this;
    }

    authorize(user, pass, options = {}) {
        console.log(`[cbs api] - authorize ${user}`);
        return new Promise((resolve, reject) => { 
            const sportId = CbsAPI.sportMapping[options.sport];
            if (!sportId) {
                console.log(`[cbs api] - ${options.sport} is not currently supported`);
                reject(`${sport} is not currently supported`);
                return;
            }
            puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}).then(async browser => {
                try {
                    const page = await browser.newPage();
                    try {
                        console.log(`[cbs api] - navigate to ${CbsAPI.login.page}`);
                        await page.goto(`${CbsAPI.login.page}?${CbsAPI.login.params}`);
                        await page.type(CbsAPI.login.userSelector, user);
                        await page.type(CbsAPI.login.passwordSelector, pass);
                        console.log('[cbs api] - submit login form')
                        await page.$eval(CbsAPI.login.form, form => form.submit());
                        await page.waitForNavigation();
                        console.log(`[cbs api] - Login Successful. Get access_tokens`);
                        await page.waitForSelector(CbsAPI.teams.waitSelector);
                        const tokens = await this.getAllTokens(page, options);
                        resolve(new CbsProfile(user, tokens));
                    } catch (err) {
                        console.log(err);
                        reject(error);
                    }
                } finally {
                    console.log('[cbs api] - close browser');
                    await browser.close();
                }
            });
        });
    }

    //TODO: Working here -- refactor this later
    loadLeagues(profile, sport) {
        console.log(`[cbs api] - loading ${sport} leagues from access_tokens`);
        return new Promise((resolve,reject) => {            
            const actions = profile.tokens.map(async details => {
                const ownerUrl = `${CbsAPI.api.owners}?${CbsAPI.api.params}&access_token=${details.token}`;
                console.log(`[espn api] - making owner request: ${ownerUrl}`)
                const ownerResp = await axios.get(ownerUrl);
                const owners = ownerResp.data.body.owners;
                const owner = owners.find(m => m.logged_in_owner);
                profile.playerDetails.push({
                    leagueId: details.leagueId,
                    ownerId: owner.id,
                    type: profile.type,
                    teamId: owner.team.id,
                    sport
                });
                const rosterUrl = `${CbsAPI.api.rosters}?${CbsAPI.api.params}&team_id=all&access_token=${details.token}`;
                console.log(`[espn api] - making roster request: ${rosterUrl}`)
                const rosterResp = await axios.get(rosterUrl);
                return {rosters: rosterResp.data.body.rosters, owners, details}
            });
            Promise.all(actions).then(arr => {
                const leagues = arr.map(data => {
                    console.log(`[cbs api] - mutate league:`);
                    const teams = data.rosters.teams.map(team => this.mapTeamData(team, data.owners));
                    console.log(teams)
                    return new League(profile.type, { 
                        user: profile.user,
                        details: data.details,
                        teams, 
                        sport 
                    });
                });
                resolve(leagues);
            });
        })
    }

    //TODO MAP OWNERS TO TEAM
    mapTeamData(team, ownersList) {
        const owners = ownersList.filter(owner => owner.team.id === team.id).map(owner => {
            owner.isLeagueManager = owner.commissioner == 1;
            owner.displayName = owner.name;
            owner.firstName = owner.displayName.split(' ')[0];
            owner.lastName = owner.displayName.split(' ')[1];
            delete owner.name;
            delete owner.team;
            delete owner.commissioner;
            delete owner.logged_in_owner;
            return owner;
        });
        
        console.log(owners)
        const roster = team.players.map(player => {
            return {
                id: player.playerId,
                firstName: player.firstname,
                lastName: player.lastname,
                fullName: player.fullname
            }
        });
        team.owners = owners;
        team.roster = roster;
        return team;
}

    /****************
     * P R I V A T E
     */

    async getAllTokens(page, options) {
        const tokens = [];
        let teamsList = await page.$$(`${CbsAPI.teams.prefixSelector}${options.sport}${CbsAPI.teams.suffixSelector}`);
        console.log(`[cbs api] - found ${teamsList.length} team(s)`);
        for (let i = 0; i < teamsList.length; i++) {
            const prop = await teamsList[i].getProperty('href');
            const href = await prop.jsonValue();
            console.log(`[cbs api] - navigate to ${href} to get access_token`);
            const token = await this.getAccessToken(page, href);
            console.log(`[cbs api] - retrieved token details:${JSON.stringify(token)}`)
            tokens.push(token);
        }
        return tokens;
    }

    async getAccessToken(page, href) {
        await page.goto(href);
        await page.screenshot({path: 'zzz.png'});
        const token = await page.evaluate(() => window.CBSi.token);
        return {
            token: token,
            league: href,
            leagueId: href.replace(/(^\w+:|^)\/\//, '').split(".")[0]
        }
    }

}