const WebSocket = require("ws");
const jwt = require("jsonwebtoken");

const server = new WebSocket.Server({ port: 4041 });

const jwtSecret = process.env.JWT_SECRET;

const wsServer = new ws.WebSocketServer({ server });

wsServer.on("connection", (connection, req) => {
  //reading username and id from cookie

  function notifyAboutOnlinePeople() {
    [...wsServer.clients].forEach(client => {
      client.send(JSON.stringify({
        online: [...wsServer.clients].map(c => ({userId:c.userId,username:c.username})),
      }));
    });
  }

  connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
      console.log('dead');
    }, 1000);
  }, 5000);

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  });

  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) {
            throw err;
          }
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());
    const {recipient, text, file} = messageData;
    let filename = null;
    if (file) {
      console.log('size', file.data.length);
      const parts = file.name.split('.');
      const ext = parts[parts.length - 1];
      filename = Date.now() + '.'+ext;
      const path = __dirname + '/uploads/' + filename;
      const bufferData = new Buffer.from(file.data.split(',')[1], 'base64');
      fs.writeFile(path, bufferData, () => {
        console.log('file saved:'+path);
      });
    }
    if (recipient && (text || file)) {
      const messageDoc = await Message.create({
        sender:connection.userId,
        recipient,
        text,
        file: file ? filename : null,
      });
      console.log('created message');
      [...wsServer.clients]
        .filter(c => c.userId === recipient)
        .forEach(c => c.send(JSON.stringify({
          text,
          sender:connection.userId,
          recipient,
          file: file ? filename : null,
          _id:messageDoc._id,
        })));
    }
  });

  // notify everyone about online people (when someone connects)
  notifyAboutOnlinePeople();
});


