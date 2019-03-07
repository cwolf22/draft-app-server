import HTTPService from '../HTTPService'
import puppeteer from 'puppeteer';
import { promises } from 'fs';

export default class EspnAPI {
    constructor() {
        this.baseUri = `http://fantasy.espn.com/apis/v3/games/flb/seasons/${new Date().getFullYear()}/segments/0/leagues/`;
    }

    import() {
        return new Promise((resolve, reject) => {
            console.log('in here');
            (async () => {
                console.log('kickoff');
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                await page.goto('https://www.espn.com/login/', {waitUntil : 'networkidle0'});
                const frames = await page.frames();
                const myframe = frames.find(f => f.url().indexOf("registerdisney.go.com") > 0);
                const email = await myframe.$("form input[type='email']");
                const password = await myframe.$("form input[type='password']");
                await email.type('cliffhanger178')
                await password.type('hilliard1')
                console.log('submitting...')
                await Promise.all([
                  myframe.click("form button[type='submit']", {waitUntil : 'networkidle0'}),
                  page.waitForNavigation({ waitUntil: 'networkidle2' }),
              ]);
                var url = 'http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/2136?forTeamId=8&view=mRoster';
                console.log('go to url');
                await page.goto(url, {waitUntil : 'networkidle0'});
                await page.content();
                const json = await page.evaluate(() =>  {
                      return JSON.parse(document.querySelector("pre").innerText); 
                  }); 
                console.log(json)
                
                console.log('done')
                await page.screenshot({path: 'done.png'});
                await browser.close();
                resolve(json);
            })();
        });
        
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