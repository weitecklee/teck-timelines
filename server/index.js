require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const expressStaticGzip = require('express-static-gzip');
const session = require('express-session');
const db = require('./db');

const app = express();

app.use(compression());
app.use(express.json());
app.use(cors());
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.secret,
}));
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});
// app.use(express.static(path.join(__dirname, '../public/')));

app.use(expressStaticGzip(path.join(__dirname, '../public/')));
app.get('*.js', (req, res, next) => {
  req.url += '.gz';
  res.set('Content-Encoding', 'gzip');
  next();
});

app.get('/getEvents', db.getEvents);
app.post('/addEvent', db.addEvent);
app.post('/addEvents', db.addEvents);
app.patch('/editEvent', db.editEvent);
app.delete('/deleteEvent', db.deleteEvent);

app.listen(process.env.PORT);
console.log(`Listening at http://localhost:${process.env.PORT}`);
