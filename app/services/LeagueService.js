import admin from 'firebase-admin'
import puppeteer from 'puppeteer'
import EspnProfile from '../models/EspnProfile'
import EspnAPI from './api/EspnAPI';

export default class LeagueService {
    static instance;

    constructor(dbConnector) {
        if (LeagueService.instance) return LeagueService.instance;

        this.dbConnector = dbConnector;
        LeagueService.instance = this;
    }

    login(uname, pass, type, sport) {
        return new Promise((resolve, reject) => {
        const api = getApi(type);
            api.authorize(uname, pass)
                .then(profile => api.loadLeagues(profile, sport))
                .then(profile => resolve(profile))
                .catch(err => reject(err));
        });
    }

    getLeagues(user) {
        return new Promise((resolve, reject) => {
            console.log('[LeagueService] - get league for user')
            let leagues = [];
            this.dbConnector.getUserLeagues(user)
                .then(userLeagues => {
                    leagues = userLeagues;
                    const actions = userLeagues.map(league => this.dbConnector.getLeague(league) );
                    return Promise.all(actions);
                })
                .then(data => {
                    const result = data.map(league => {
                        const userLgInfo = leagues.find(l => l.leagueId == league.id);
                        return {
                          ...league,
                          type: userLgInfo.type,
                          sport: userLgInfo.sport,
                          teamId: userLgInfo.teamId,
                          ownerId: userLgInfo.ownerId
                        }
                    });
                    resolve(result);
                })
                .catch(err => reject(err));
        });
    }

    
    espnAuthorize(uname, pass) {
        console.log(`[espn] - loginUser ${uname} : get login form...`);
        return new Promise((resolve, reject) => {
            
            puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}).then(async browser => {
                try {
                    const page = await browser.newPage();
                    try {
                        await page.goto(LeagueService.espn.login.page, {waitUntil : 'networkidle0'});
                        const frames = await page.frames();
                        const myframe = frames.find(f => f.url().indexOf(LeagueService.espn.login.iframeDomain) > 0);
                        const email = await myframe.$(LeagueService.espn.login.emailSelector);
                        const password = await myframe.$(LeagueService.espn.login.passwordSelector);
                        await email.type(uname)
                        await password.type(pass)
                        console.log('[espn] - Submitting Form...');
                        await Promise.all([
                            myframe.click(LeagueService.espn.login.submitSelector, {waitUntil : 'networkidle0'}),
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
                        const profile = new EspnProfile(cookies);
                        if (!profile.isAuthenticated) throw `[espn] - Unable to Authenticate ${uname} through API`
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

    storeLeagues(user, profile, type, sport) {
        const leagues = profile.leagues[sport];
        console.log(`[LeagueService] - storing ${leagues.length} ${sport} leagues`)
        return new Promise((resolve, reject) => {
            try {
                leagues.forEach(league => {
                    this.storeLeague(user, league, type, sport)
                        .then(() => this.updateUser(user, league, type, sport))
                        .catch(err => {throw err});
                })
                resolve(profile.leagues);
            } catch (err) {
                reject(err);
            }
        });
    }
    
    storeLeague(user, league, type, sport) {
        try {
            const metaId = league.meta.id.toString();
            const db = admin.firestore().collection(`leagues/${sport}/${type}`);
            const teams = league.teams.map(team => {

                const roster = team.roster.entries.map(player => {
                    const pmeta = player.playerPoolEntry.player;
                    return {
                        id: player.playerId,
                        firstName: pmeta.firstName,
                        lastName: pmeta.lastName,
                        fullName: pmeta.fullName
                    }
                });

                return { 
                    id: team.id,
                    location: team.location,
                    nickname: team.nickname,
                    owners: team.owners,
                    abbreviation: team.abbrev,
                    roster
                }
            });
            return db.doc(metaId).set({
                ts: admin.firestore.Timestamp.fromDate(new Date()),
                id: league.meta.id,
                name: league.meta.name,
                importBy: user,
                teams
            });  
        } catch (err) {
            return new Promise((resolve,reject) => reject(err));
        } 
    }

    updateUser(user, league, type, sport) {
        const db = admin.firestore().collection(`users/${user.toLowerCase()}/leagues/`);
        return db.doc(league.meta.id.toString()).set({
            ts: admin.firestore.Timestamp.fromDate(new Date()),
            leagueId: league.meta.id,
            teamId: league.team,
            ownerId: league.ownerId,
            sport,
            type
        }); 
    }

    /*******************
     * P R I V A T E
     */

    getApi(type) {
        switch(type) {
            case 'espn':
                return new EspnAPI();
            case 'cbs':
                return new CbsAPI();
            default:
                return null;
        }
    }
}

