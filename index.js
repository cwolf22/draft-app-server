import express from 'express';
import bodyParser from 'body-parser';
import path from 'path'
import cors from 'cors';

const app = express();

console.log(`Node ENV: ${process.env.NODE_ENV}`)
const corsOrigin = [/baitingsheep\.com/]
if (typeof(process.env.NODE_ENV) == 'undefined') corsOrigin.push(/localhost/)

//ENABLE CORS
app.use(cors({
    origin: corsOrigin,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200
}))

app.use(express.json());
app.use(require('morgan')('dev'));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bs/v1/drafter', require('./app'))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
  });
  
  // error handler
  app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });
  
module.exports = app;