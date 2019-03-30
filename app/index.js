import express from 'express';
import unsecured from './routes/unsecured';
import leagues from './routes/secured/leagues';
import AuthenticationMiddleware from './middleware/AuthenticationMiddleware';

const app = express();
app.use('/',  unsecured);
app.use('/leagues', AuthenticationMiddleware, leagues);

module.exports = app;
