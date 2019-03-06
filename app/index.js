import express from 'express';
import admin from "firebase-admin";
import config from './config'
import unsecured from './routes/unsecured';
import leagues from './routes/secured/leagues';
import AuthenticationMiddleware from './middleware/AuthenticationMiddleware';

const app = express();

admin.initializeApp({
  credential: admin.credential.cert(config.secrets.FIREBASE.credential),
  databaseURL: config.secrets.FIREBASE.databaseURL
});

app.use('/',  unsecured);
app.use('/leagues', AuthenticationMiddleware, leagues);

module.exports = app;
