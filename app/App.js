import express from 'express';
import admin from "firebase-admin";
import config from './config'
import unsecured from './routes/unsecured';
//import auth from './routes/secured/auth';
import AuthenticationMiddleware from './middleware/AuthenticationMiddleware';

const app = express();

admin.initializeApp({
  credential: admin.credential.cert(config.secrets.FIREBASE.credential),
  databaseURL: config.secrets.FIREBASE.databaseURL
});
app.use('/',  unsecured);
//app.use('/users', AuthenticationMiddleware, auth);

module.exports = app;
