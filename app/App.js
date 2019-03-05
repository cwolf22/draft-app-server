import express from 'express';
import admin from "firebase-admin";

import unsecured from './routes/unsecured';
//import auth from './routes/secured/auth';
import AuthenticationMiddleware from './middleware/AuthenticationMiddleware';

const app = express();

const serviceAccount = require('./services/firebase-account.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://drafter-60f92.firebaseio.com"

});
app.use('/',  unsecured);
//app.use('/users', AuthenticationMiddleware, auth);

module.exports = app;
