import axios from "axios";
import config from '../config';
import EspnAPI from "./api/EspnAPI";
export default class ESPNTransactionService {

    static transaction = {
        url: 'http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/49976/communication/?view=kona_league_communication',
        config: {
            headers: {
                'X-Fantasy-Platform' : 'kona-PROD-874e25771e9127d432fe3c2f66b5ccaea0fc511f',
                'X-Fantasy-Source' : 'kona',
                Cookie: 'espnAuth={"swid":"{B89096F2-E5B9-4541-A5E3-6BC80F22D56E}"}; SWID={B89096F2-E5B9-4541-A5E3-6BC80F22D56E}; espn_s2=AEAtwj9/ToHV0pVNzjdAqZxo2pPFW2Pwf283t6j5Y9T6RiY69a50lcTkh6j/EFG7tR8I6+/EmhKdMnh9gBdSEcDV0UhP7i8ysD1HmgN9nDsfcRr2qjhT31wuhmH9krSE+40qjn9pNcAedNvoFeM/Z++egh7bcRQFRg0ogn1tvaE3PWw8alcuETZXhJqkjkWlbOXNmCVCgVZXPpqv/LovYNjgkQFZd3ftIdbOlVrp9kFrZ+zDsTESxsfRnDoVaHUTKWuTqAjvUWIhb3PDHm2XzJXiTSSomGwmzDTsi3nq23d75Q=='
            }
        },
        cookies: {
            espnAuth: '{"swid":"{B89096F2-E5B9-4541-A5E3-6BC80F22D56E}"}',
            SWID:'{B89096F2-E5B9-4541-A5E3-6BC80F22D56E}',
            espn_s2: ''
            
        }
    }

    //1553486400000
    //1553572799999

    constructor() {
        this.espnAPI = new EspnAPI();
        this.config = ESPNTransactionService.transaction.config;
        this.players = [];
    }

    storePlayers() {
        console.log("store Players")
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

    
    async getTransactions() {
        console.log('[get them trans]');
        const _config = Object.assign({}, this.config);
        const startTime = new Date();
        const endTime = new Date();
        startTime.setHours(0,0,0,0);
        endTime.setHours(24,0,0,-1);
        _config.headers['X-Fantasy-Filter'] = `{"topics":{"filterType":{"value":["ACTIVITY_TRANSACTIONS"]},"limit":100,"limitPerMessageSet":{"value":100},"offset":0,"sortMessageDate":{"sortPriority":1,"sortAsc":false},"sortFor":{"sortPriority":2,"sortAsc":false},"filterDateRange":{"value":${startTime.getTime()},"additionalValue":${endTime.getTime()}},"filterIncludeMessageTypeIds":{"value":[178,180]}}}`
        const resp =  await axios.get('http://fantasy.espn.com/apis/v3/games/flb/seasons/2019/segments/0/leagues/49976/communication/?view=kona_league_communication', _config);
        return resp.data;
    }

    modelData(data) {
       const mapped = data.topics.map(t => {
           const player = this.players.find(p => p.id == t.messages[0].targetId);
           return {...player, date: t.date};
       });
       return mapped;
    }

    compareAndRepsond(transactions, rows) {
        return new Promise((resolve, reject) => {
            const illegalTransactions = transactions.map(tr => {
                console.log(tr)
                const row = rows.find(row => tr.fullName == row.player);
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
