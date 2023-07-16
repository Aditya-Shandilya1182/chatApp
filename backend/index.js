const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Message = require('./models/Message');
const ws = require('ws');
const fs = require('fs');

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

dotenv.config();
app.use(express.json());
//app.use(cookieParser());

const url = process.env.MONGO_URL;
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB Atlas!');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB Atlas:', error);
  });
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL,
}));

//TESTING
app.get('/test', (req,res) => {
    res.json("test ok");
});

//API SERVER
app.post('/login', async (req,res) => {
  const {username, password} = req.body;
  const foundUser = await User.findOne({username});
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign({userId:foundUser._id,username}, jwtSecret, {}, (err, token) => {
        res.cookie('token', token, {sameSite:'none', secure:true}).json({
          id: foundUser._id,
        });
      });
    }
  }
});

app.post('/logout', (req,res) => {
  res.cookie('token', '', {sameSite:'none', secure:true}).json('ok');
});

app.post('/register', async (req,res) => {
  const {username,password} = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username:username,
      password:hashedPassword,
    });
    jwt.sign({userId:createdUser._id,username}, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
        id: createdUser._id,
      });
    });
  } catch(err) {
    if (err) throw err;
    res.status(500).json('error');
  }
});

const server = app.listen(4040);

//WEB SOCKETS SERVER
const wsServer = new ws.WebSocketServer({server});

wsServer.on('connection', (connection, req) =>{
  const cookies = req.headers.cookie;
  if(cookies){
    const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
    if(tokenCookieString){
      const token = tokenCookieString.split('=')[1];
      if(token){
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if(err){
            throw err;
          }
          const {userId, username} = userData;
          connection.userId = userId;
          connection.username = username;
        })
      }
    }
  }
});