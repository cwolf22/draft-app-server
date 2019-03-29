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
        console.log(`[DBConnector] - Create User: ${user}`);
        const users = admin.firestore().collection("users");
        return users.doc(user.toLowerCase()).set({email:user, hash, ts: admin.firestore.Timestamp.fromDate(new Date()) })
    }

    getUser(user) {
        console.log(`[DBConnector] - Get User: ${user}`);
        const users = admin.firestore().collection("users");
        return users.doc(user.toLowerCase()).get();
    }   

    async getUserAuthorizations(member, credentials, meta) {
        console.log(`[DBConnector] - Get User Authorization: ${member}`);
        const users = admin.firestore().collection(`users/${member}/leagues`);
        const query = await users.where('username', '==', credentials.username).where('type', '==', meta.type).where('sport', '==', meta.sport);
        const qr = await query.get();
        return qr.docs.map(doc => doc.data());
    }

    async getUserLeagues(user) {
        console.log(`[DBConnector] - Get User Leagues: ${user}`);
        const snapshot = await admin.firestore().collection(`users/${user.toLowerCase()}/leagues/`).get();
        return snapshot.docs.map(doc => doc.data());
    }

    async getLeague(league) {
        console.log(`[DBConnector] - Get League: ${league.sport}/${league.type}/${league.leagueId}`);
        const doc = await admin.firestore().doc(`leagues/${league.sport}/${league.type}/${league.leagueId}`).get();
        return doc.data();
    }

    storeLeague(league, addedFields = {}) {
        console.log(`[DBConnector] - Store League: leagues/${league.sport}/${league.type}`);
        const db = admin.firestore().collection(`leagues/${league.sport}/${league.type}`);
            return db.doc(league.id.toString()).set({ ...league, ...addedFields });  
    }

    storeUserDetails(user, details, addedFields = {}) {
        console.log(`[DBConnector] - Store League for User: users/${user.toLowerCase()}/leagues/`);
        const ts = admin.firestore.Timestamp.fromDate(new Date());
        const db = admin.firestore().collection(`users/${user.toLowerCase()}/leagues/`); 
        return db.doc(details.leagueId.toString()).set({
            ...addedFields,
            ...details
        }); 
    }

    getTimestamp() {
        return admin.firestore.Timestamp.fromDate(new Date());
    }
}