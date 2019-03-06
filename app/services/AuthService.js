import admin from 'firebase-admin'
import bcrypt from 'bcrypt'

const AuthService = () => {
    return {
        register: (email, password) => new Promise((resolve, reject) => {
            const hash = bcrypt.hashSync(password, 10);
            const users = admin.firestore().collection("users");
            users.doc(email).set({email, hash, ts: admin.firestore.Timestamp.fromDate(new Date()) })
                .then(() => resolve(hash))
                .catch(err => {
                    console.log(err)
                    reject({status:500, error: err})
                });
        }),
        login: (email, password) => new Promise((resolve, reject) => {
            const users = admin.firestore().collection("users");
            users.doc(email).get()
              .then(doc => {
                  const hash = doc.get('hash');
                  if (hash && bcrypt.compareSync(password, hash)) resolve(hash);
                  reject({status: 401, message: 'Username or password is incorrect'});
              })
              .catch(err => reject({status:500, error: err}));
        })
    }
}

export default AuthService