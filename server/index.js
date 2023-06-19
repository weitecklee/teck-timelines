require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const expressStaticGzip = require('express-static-gzip');
const session = require('express-session');
const axios = require('axios');
const db = require('./db');

const app = express();
const randomColor = () => (`hsl(${Math.floor(Math.random() * 360)}, ${Math.floor(Math.random() * 31) + 70}%, ${Math.floor(Math.random() * 31) + 30}%)`);

app.use(compression());
app.use(express.json());
app.use(cors());
app.use(session({
  resave: true,
  rolling: true,
  saveUninitialized: true,
  secret: process.env.secret,
  cookie: {
    maxAge: 34560000000,
  },
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
app.delete('/clearEvents', db.clearEvents);

app.post('/demo', (req, res) => {
  axios.post(`${process.env.api_url}/action/find`, {
    dataSource: 'AnimalCrossing',
    database: 'lasagnark',
    collection: 'history',
    filter: {},
  }, {
    headers: {
      'api-key': `${process.env.api_key}`,
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      const demoData = [];
      response.data.documents.forEach((doc) => {
        const tmp = {
          event: doc.name,
          startDate: doc.startDate,
          endDate: doc.endDate || new Date(),
          backgroundColor: randomColor(),
        };
        demoData.push(tmp);
      });
      req.body = demoData;
      return db.addEvents(req, res);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.listen(process.env.PORT);
console.log(`Listening at http://localhost:${process.env.PORT}`);
