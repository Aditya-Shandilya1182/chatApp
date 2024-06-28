const ws = require("ws");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const dotenv = require("dotenv");
const Message = require("./models/Message");
const mongoose = require("mongoose");

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const server = new ws.Server({ port: 4004 });
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

function notifyAboutOnlinePeople() {
  [...server.clients].forEach(client => {
    client.send(JSON.stringify({
      online: [...server.clients].map(c => ({ userId: c.userId, username: c.username })),
    }));
  });
}

server.on("connection", (connection, req) => {
  function keepAlive() {
    connection.isAlive = true;
    connection.timer = setInterval(() => {
      connection.ping();
      connection.deathTimer = setTimeout(() => {
        connection.isAlive = false;
        clearInterval(connection.timer);
        connection.terminate();
        notifyAboutOnlinePeople();
      }, 10000);
    }, 50000);

    connection.on('pong', () => {
      clearTimeout(connection.deathTimer);
    });
  }

  keepAlive();

  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies.split(";").find((str) => str.trim().startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, (err, userData) => {
          if (err) {
            console.log('JWT verification error in WebSocket:', err);
            return;
          }
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
          notifyAboutOnlinePeople();
        });
      }
    }
  }


  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, file } = messageData;
    let filename = null;
    if (file) {
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      filename = Date.now() + '.' + ext;
      const path = __dirname + '/uploads/' + filename;
      const bufferData = new Buffer.from(file.data.split(',')[1], 'base64');
      fs.writeFile(path, bufferData, () => {
        console.log('file saved:' + path);
      });
    }
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? filename : null,
      });
      [...server.clients]
        .filter(c => c.userId === recipient)
        .forEach(c => c.send(JSON.stringify({
          text,
          sender: connection.userId,
          recipient,
          file: file ? filename : null,
          _id: messageDoc._id,
        })));
    }
  });

  notifyAboutOnlinePeople();
});

console.log("WebSocket Service running on port 4004");
