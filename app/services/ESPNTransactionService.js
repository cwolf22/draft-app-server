import axios from "axios";
import config from '../config';
import EspnAPI from "./api/EspnAPI";
import LeagueService from './LeagueService';

export default class ESPNTransactionService {
    static instance;

    static transaction = {
        url: 'http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/49976/communication/?view=kona_league_communication',
        config: {
            headers: {
                'X-Fantasy-Platform' : 'kona-PROD-874e25771e9127d432fe3c2f66b5ccaea0fc511f',
                'X-Fantasy-Source' : 'kona'
            }
        }
    }

    constructor(dbConnector) {
        if (ESPNTransactionService.instance) return ESPNTransactionService.instance;

        this.espnAPI = new EspnAPI();
        this.leagueService = new LeagueService(dbConnector);
        this.defaultUser = config.credentials.ESPN;
        this.players = [];

        ESPNTransactionService.instance = this;
    }

    storePlayers() {
        console.log("Get Players")
        return new Promise((resolve, reject) => {
            this.espnAPI.getPlayerList()
                .then(response => {
                    this.players = response.data;
                    console.log(this.players.length);
                    resolve(this.players)
                })
                .catch(err => reject(err))
        })
    }

    
    async getTransactions(meta) {
        console.log('[get them trans]');
        const profile = await this.leagueService.login(this.defaultUser.member,
            {username : this.defaultUser.username, password: this.defaultUser.password},
            {sport: meta.sport, type: meta.type});
        const config = Object.assign({}, ESPNTransactionService.transaction.config);
        const startTime = new Date();
        const endTime = new Date();
        startTime.setHours(0, 0, 0, 0);
        config.headers.Cookie = profile.getCookieString();
        config.headers['X-Fantasy-Filter'] = `{"topics":{"filterType":{"value":["ACTIVITY_TRANSACTIONS"]},"limit":100,"limitPerMessageSet":{"value":100},"offset":0,"sortMessageDate":{"sortPriority":1,"sortAsc":false},"sortFor":{"sortPriority":2,"sortAsc":false},"filterDateRange":{"value":${startTime.getTime()},"additionalValue":${endTime.getTime()}},"filterIncludeMessageTypeIds":{"value":[178,180]}}}`
        const resp =  await axios.get('http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/49976/communication/?view=kona_league_communication', config);
        return resp.data;
    }

    modelData(data) {
       const mapped = data.topics.map(t => {
           const player = this.players.find(p => p.id == t.messages[0].targetId);
           return {...player, date: t.date};
       });
       console.log(mapped)
       return mapped;
    }

    compareAndRespond(transactions, rows) {
        return new Promise((resolve, reject) => {
            const illegalTransactions = transactions.map(tr => {
                console.log(tr)
                const row = rows.find(row => tr.fullName.trim() == row.player.trim());
                if (row) return { owner: row.owner, player:row.player }
                return null;
            }).filter(action => action != null);
            console.log(illegalTransactions.length)
            if (illegalTransactions.length == 0) {
                resolve({
                    status:200,
                    data: 'All Transactions Valid'
                });
            } else {
                reject({
                    status:409,
                    data: illegalTransactions
                });
            }
        });
    }
}
