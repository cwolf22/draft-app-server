import admin from 'firebase-admin'
import config from '../config'

export default class DBConnector {
    static instance;

    constructor() {
        if (DBConnector.instance)  return DBConnector.instance;

        admin.initializeApp({
            credential: admin.credential.cert(config.secrets.FIREBASE.credential),
            databaseURL: config.secrets.FIREBASE.databaseURL
        });
        DBConnector.instance = this;
    }

    createUser(user, hash) {
        const users = admin.firestore().collection("users");
        return users.doc(user.toLowerCase()).set({email:user, hash, ts: admin.firestore.Timestamp.fromDate(new Date()) })
    }

    getUser(user) {
        console.log(`[DBConnector] - Get User: ${user}`)
        const users = admin.firestore().collection("users");
        return users.doc(user.toLowerCase()).get();
    }   

    async getUserLeagues(user) {
        const snapshot = await admin.firestore().collection(`users/${user.toLowerCase()}/leagues/`).get();
        return snapshot.docs.map(doc => doc.data());
    }

    async getLeague(league) {
        const doc = await admin.firestore().doc(`leagues/${league.sport}/${league.type}/${league.leagueId}`).get();
        return doc.data();
    }
}