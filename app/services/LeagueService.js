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

    getLeagues(user) {
        return new Promise((resolve, reject) => {
            console.log('[LeagueService] - get league for user')
            let leagues = [];
            const userLeaguesDb = admin.firestore().collection(`users/${user}/leagues/`);
            userLeaguesDb.get()
                .then(snapshot =>  snapshot.docs.map(doc => doc.data()) )
                .then(userLeagues => {
                    leagues = userLeagues;
                    const actions = userLeagues.map(league => admin.firestore().doc(`leagues/${league.sport}/${league.type}/${league.leagueId}`).get() );
                    return Promise.all(actions);
                })
                .then(docs => {
                    const data = docs.map(doc => doc.data())
                    const result = data.map(league => {
                        const uleague = leagues.find(l => l.leagueId == league.id);
                        return {
                          ...league,
                          type: uleague.type,
                          sport: uleague.sport,
                          teamId: uleague.teamId
                        }
                    });
                    
                    resolve(result);
                })
                .catch(err => {
                    reject(err)
                });

    });
            /*return db.doc(league.meta.id.toString()).set({
            ts: admin.firestore.Timestamp.fromDate(new Date()),
            leagueId: league.meta.id,
            teamId: league.team
        });
        */
    }

    login(user, uname, pass, type, sport) {
        return new Promise((resolve, reject) => {
            try {
                switch(type) {
                    case 'espn':
                        this.espnAuthorize(user, uname, pass)
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

    espnAuthorize(user, uname, pass) {
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

    espnLogin() {

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
        const db = admin.firestore().collection(`users/${user}/leagues/`);
        return db.doc(league.meta.id.toString()).set({
            ts: admin.firestore.Timestamp.fromDate(new Date()),
            leagueId: league.meta.id,
            teamId: league.team,
            sport,
            type
        }); 
    }
}

