import admin from 'firebase-admin'
import puppeteer from 'puppeteer'
import EspnProfile from '../models/EspnProfile'

export default class LeagueService {
    static espn = {
        login: {
            page: 'https://www.espn.com/login/',
            iframeDomain: 'registerdisney.go.com',
            emailSelector: 'form input[type="email"]',
            passwordSelector: 'form input[type="password"]',
            submitSelector: 'form button[type="submit"]'
        }
    }
    constructor() {
        console.log("[LeagueService] - instantiated")
    }

    login(uname, pass, type, sport) {
        return new Promise((resolve, reject) => {
            try {
                switch(type) {
                    case 'espn':
                        this.espnLogin(uname, pass)
                            .then(profile => profile.load(sport))
                            .then(profile => resolve(profile))
                            .catch(err => reject(err));
                        break;
                    case 'cbs':
                        resolve(new CbsAPI());
                        break;
                    default:
                        reject({status: 500, error: `No API exists for type: ${type}`});
                        break;
                }
            } catch (err) {
                console.log("rejecting hurr")
                console.log(err);
                reject({status: 500, error:err})
            }
        });
    }

    espnLogin(uname, pass) {
        console.log(`[espn] - loginUser ${uname} : get login form...`);
        return new Promise((resolve, reject) => {
            puppeteer.launch().then(async browser => {
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
            const batch = admin.firestore().batch();
            batch.set(db.doc(metaId), {
                ts: admin.firestore.Timestamp.fromDate(new Date()),
                id: league.meta.id,
                name: league.meta.name,
                importBy: user
            });
            const teamsDb = db.doc(metaId).collection('teams');
            league.teams.forEach(team => {
                const tdoc = teamsDb.doc(team.id.toString());
                batch.set(tdoc, { 
                    ts: admin.firestore.Timestamp.fromDate(new Date()),
                    id: team.id,
                    location: team.location,
                    nickname: team.nickname,
                    owners: team.owners,
                    abbreviation: team.abbrev
                }); 
                team.roster.entries.forEach(player =>{
                    const pmeta = player.playerPoolEntry.player;
                    const pdoc = tdoc.collection('roster').doc(player.playerId.toString());
                    batch.set(pdoc, {
                        ts: admin.firestore.Timestamp.fromDate(new Date()),
                        id: player.playerId,
                        firstName: pmeta.firstName,
                        lastName: pmeta.lastName,
                        fullName: pmeta.fullName
                    })
                });
            });
            return batch.commit();   
        } catch (err) {
            return new Promise((resolve,reject) => reject(err));
        } 
    }

    updateUser(user, league, type, sport) {
        const db = admin.firestore().collection(`users/${user}/leagues/${sport}/${type}`);
        return db.doc(league.meta.id.toString()).set({
            ts: admin.firestore.Timestamp.fromDate(new Date()),
            leagueId: league.meta.id,
            teamId: league.team
        }); 
    }
}

