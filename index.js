import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3030;

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

app.use(require('morgan')('dev'));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: false}));
app.use('/bs/v1/drafter', require('./app/App'))

app.listen(port, () => console.log('We are live on ' + port));