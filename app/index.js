import express from 'express';
import unsecured from './routes/unsecured';
import leagues from './routes/secured/leagues';
import AuthenticationMiddleware from './middleware/AuthenticationMiddleware';

const app = express();
app.use('/',  unsecured);
app.use('/leagues', AuthenticationMiddleware, leagues);

if (!String.prototype.format) {
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined'
          ? args[number]
          : match
        ;
      });
    };
  }

module.exports = app;
