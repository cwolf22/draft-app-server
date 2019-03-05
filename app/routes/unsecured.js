import express from 'express';
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';

const router = express.Router();

router.get('/ping', (req, res) => {
    const users = admin.firestore().collection("users");
    users.doc('wolf').set({first: 'christ', last:'wolf', phone: 123 })
      .then(() => res.json({good: "ok"}))
      .catch((err) => res.status(500).json({error: err}))
});
router.put('/register', (req, res) => {
    console.log('Register')
    console.log(req.body);
    const email = req.body.email;
    const hash = bcrypt.hashSync(req.body.password, 10);
    console.log(`Password Hash: ${hash}`)
    const users = admin.firestore().collection("users");
    users.doc(email).set({ email: email, hash: hash})
      .then(resp => res.json({data:resp}))
      .catch(err => res.status(500).json({error: err}));
});
router.post('/login', (req, res) => {
    const storedHash = '' //getStoredHash
    if (bcrypt.compareSync(req.body.password, storedHash)) {
        res.json({token : 'success'})
       } else {
        res.status(401).send({message: 'Username or password is incorrect'})
       }
})
export default router;