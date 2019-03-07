import admin from 'firebase-admin'
import EspnAPI from './api/EspnAPI'

const LeagueService = () => {
    return {
        getAPI: (type, sport) => new Promise((resolve, reject) => {
            switch(type) {
                case 'ESPN':
                try {
                    console.log("returning new espn api")
                    resolve(new EspnAPI());
                } catch (err) {
                    console.log(err);
                    reject(err)
                }
                    break;
                case 'CBS':
                    resolve(new CbsAPI());
                    break;
                default:
                    reject({status: 500, error: `No API exists for type: ${type}`})
            }
        }),
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
    }
}

export default LeagueService