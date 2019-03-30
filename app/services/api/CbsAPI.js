import puppeteer from 'puppeteer';
import axios from 'axios'
import CbsProfile from "../../models/CbsProfile";
import League from '../../models/League';
import config from '../../config'

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

    static allowedTypes = ['mgmt', ]

    constructor() {
        if (CbsAPI.instance) return CbsAPI.instance;

        this.defaultCredentials = {
            username: config.credentials.CBS.username,
            password: config.credentials.CBS.password
        }
        CbsAPI.instance = this;
    }

    async authorize(member, credentials = {}, options = {}) {
        console.log(`[cbs api] - authorize ${member}`);
        
        if (options.dbConnector) {
            let allTokens = true;
            const records = await options.dbConnector.getUserAuthorizations(member, credentials, {sport: options.sport, type: 'cbs'});
            const auths = records.map(record => {
                if (!record.authorization) allTokens = false;
                return record.authorization;
            });
            if (auths.length > 0 && allTokens) {
              console.log('[cbs api] - returning stored authorization');
              return new CbsProfile(credentials.username, auths, false);
            }
        }
        console.log('[cbs api] - No stored authorization -- fire up login form');
        return await this.reAuthorize(credentials.username, credentials.password, options);
    }

    //TODO: Clean this crap up
    async reAuthorize(user, pass, options) {
        return new Promise((resolve, reject) => { 
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
                        console.log(`[cbs api] - Login Complete. Get access_tokens`);
                        await page.waitForSelector(CbsAPI.teams.waitSelector);
                        const tokens = await this.getAllTokens(page, options);
                        console.log(`[cbs api] - ${tokens.length} valid leagues`);
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

    loadLeagues(profile, sport) {
        console.log(`[cbs api] - loading ${sport} leagues from access_tokens`);
        return new Promise((resolve,reject) => {            
            const actions = profile.tokens.map(async details => {
                const ownerUrl = `${CbsAPI.api.owners}?${CbsAPI.api.params}&access_token=${details.token}`;
                console.log(`[cbsi api] - making owner request: ${ownerUrl}`)
                const ownerResp = await axios.get(ownerUrl);
                const owners = ownerResp.data.body.owners;
                const owner = owners.find(m => m.logged_in_owner);
                profile.playerDetails.push({
                    leagueId: details.leagueId,
                    ownerId: owner.id,
                    type: profile.type,
                    teamId: parseInt(owner.team.id),
                    authorization: details,
                    username: profile.user,
                    sport
                });
                const rosterUrl = `${CbsAPI.api.rosters}?${CbsAPI.api.params}&team_id=all&access_token=${details.token}`;
                console.log(`[cbsi api] - making roster request: ${rosterUrl}`)
                const rosterResp = await axios.get(rosterUrl);
                return {rosters: rosterResp.data.body.rosters, owners, details}
            });
            Promise.all(actions).then(arr => {
                const leagues = arr.map(data => {
                    console.log(`[cbs api] - mutate league`);
                    const teams = data.rosters.teams.map(team => this.mapTeamData(team, data.owners));

                    return new League(profile.type, { 
                        user: profile.user,
                        details: data.details,
                        teams, 
                        sport 
                    });
                });
                profile.leagues = leagues;
                resolve(profile);
            });
        })
    }

    //TODO: OBJECT FOR MAPPING OWNERS TO TEAM
    mapTeamData(team, ownersList) {
        const owners = ownersList.filter(owner => owner.team.id == team.id).map(ownerObj => {
            const owner = Object.assign({}, ownerObj);
            const name = owner.name.split(' ');
            owner.isLeagueManager = owner.commissioner == 1;
            owner.displayName = owner.name;
            owner.firstName = name.length > 0 ? name[0] : '';
            owner.lastName = name.length > 1 ? name[1] : '';
            delete owner.name;
            delete owner.team;
            delete owner.commissioner;
            delete owner.logged_in_owner;
            return owner;
        });
        
        const roster = team.players.map(player => {
            return {
                id: parseInt(player.id),
                firstName: player.firstname,
                lastName: player.lastname,
                fullName: player.fullname
            }
        });
        
        team.owners = owners;
        team.roster = roster;
        team.id = parseInt(team.id);
        team.abbrev = team.abbr;
        delete team.abbr;
        delete team.projected_points;
        delete team.lineup_status;
        delete team.players;
        delete team.warning;
        delete team.point;
        delete team.long_abbr;
        delete team.short_name;
        delete team.division;
        return team;
}

    /****************
     * P R I V A T E
     */

    async getAllTokens(page, options) {
        const tokens = [];
        let teamsList = await page.$$(`${CbsAPI.teams.prefixSelector}${options.sport}${CbsAPI.teams.suffixSelector}`);
        console.log(`[cbs api] - found ${teamsList.length} team(s)`);
        const hrefs = [];
        for (let i = 0; i < teamsList.length; i++) {
            const prop = await teamsList[i].getProperty('href');
            const href = await prop.jsonValue();
            hrefs.push(href);
        }
        for (let i = 0; i <hrefs.length; i++) {
            console.log(`[cbs api] - navigate to ${hrefs[i]} to get check league type and access_token`);
            const token = await this.getAccessToken(page, hrefs[i]);
            tokens.push(token);
        }
        return tokens.filter(token => CbsAPI.allowedTypes.includes(token.leagueType));
    }

    async getAccessToken(page, href) {
        await page.goto(href);
        const details = await page.evaluate(() => {
            return {
                token: window.CBSi.token,
                leagueId: window.FANTASY_LEAGUE_JS_GLOBALS.leagueId,
                leagueType: window.FANTASY_LEAGUE_JS_GLOBALS.leagueType,
                leagueName: window.FANTASY_LEAGUE_JS_GLOBALS.leagueName
            };
        });
        details.href = href;
        return details;
    }

}