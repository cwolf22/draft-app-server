import express from 'express';
import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'

const router = express.Router();

router.get('/ping', (req, res) => {
    const users = admin.firestore().collection("users");
    users.doc('wolf').set({first: 'christ', last:'wolf', phone: 123 })
      .then(() => res.json({good: "ok"}))
      .catch((err) => res.status(500).json({error: err}))
});
//TODO: create a real config secret
router.put('/register', (req, res) => {
    console.log(`Registering user: ${req.body.email}`)
    const hash = bcrypt.hashSync(req.body.password, 10);
    const users = admin.firestore().collection("users");
    users.doc(req.body.email).set({ email: req.body.email, hash: hash})
      .then(resp => {
        const token = jwt.sign({ email: req.body.email, hash: hash},'config-secret', { expiresIn: '24h' });
        console.log(`Sending JWT back ${token}`);
        res.json({data:{ response: resp, token: token } });
      }).catch(err => res.status(500).json({error: err}));
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