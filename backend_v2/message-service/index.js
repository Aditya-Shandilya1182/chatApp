const express = require("express");
const Message = require("../models/Message");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const jwtSecret = process.env.JWT_SECRET;

app.get("/test", (req, res) => {
    res.json("test ok");
  });
  

app.get('/messages/:userId', async (req, res) =>{
    const { userId } = req.params;
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, async (err, userData) => {
      if (err) {
        res.status(401).json('Unauthorized');
      } else {
        const ourUserId = userData.userId;
        const messages = await Message.find({
          sender: { $in: [userId, ourUserId] },
          recipient: { $in: [userId, ourUserId] },
        }).sort({ createdAt: 1 });
        res.json(messages);
      }
    });
  } else {
    res.status(401).json('Unauthorized');
  }
});

const server = app.listen(4040);