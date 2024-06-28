const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Message = require("./models/Message");
const jwt = require("jsonwebtoken");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
      origin: "http://localhost:5173", // Update with your frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"], // Allow all HTTP methods
      allowedHeaders: ["Content-Type", "Authorization", "Origin", "X-Requested-With", "Accept"], // Allow headers
      credentials: true, // Allow sending cookies
    
  })
);
const jwtSecret = process.env.JWT_SECRET;

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));
  
  function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
      let token;
      if (req.headers.cookie) {
        // Check cookies for token
        const tokenCookieString = req.headers.cookie.split(";").find((str) => str.trim().startsWith("token="));
        if (tokenCookieString) {
          token = tokenCookieString.split("=")[1];
          console.log('Token from cookies:', token);
        }
      }
  
      if (token) {
        jwt.verify(token, jwtSecret, (err, userData) => {
          if (err) {
            console.log('JWT verification error:', err);
            reject(err); // Handle JWT verification error
          } else {
            resolve(userData); // Resolve with user data if token is valid
          }
        });
      } else {
        console.log('No token provided');
        reject(new Error('No token provided')); // Reject with error if no token found
      }
    });
  }
  
  
  

app.get("/test", (req, res) => {
  res.send("Message Service is working");
});

app.get('/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
      sender: { $in: [userId, ourUserId] },
      recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error retrieving messages:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(4003, () => {
  console.log("Message Service running on port 4003");
});
