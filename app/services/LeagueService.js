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

    login(uname, pass, type) {
        return new Promise((resolve, reject) => {
            try {
                switch(type.toUpperCase()) {
                    case 'ESPN':
                        this.espnLogin(uname, pass)
                            .then(profile => profile.load())
                            .then(profile => resolve(profile))
                            .catch(err => {throw err});
                        break;
                    case 'CBS':
                        resolve(new CbsAPI());
                        break;
                    default:
                        reject({status: 500, error: `No API exists for type: ${type}`});
                        break;
                }
            } catch (err) {
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
                        page.waitForNavigation( {timeout: 10000 }),
                    ]);
                } catch (err) {
                    console.log('[espn] - Login Failure');
                    console.log(err);
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
}
        /*
        store: (user, form) => new Promise((resolve, reject) => {
            admin.firestore().collection("users").doc(user).collection('leagues').add({
                sport: form.sport,
                type: form.type,
                leagueId: form.leagueId,
                teamId: form.teamId,
                ts: admin.firestore.Timestamp.fromDate(new Date())
            })
              .then( (resp) => resolve(resp))
              .catch( (err) => reject({status: 500, error: err }))
        }),
        */
