const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const User = require("./models/User");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
      origin: "http://localhost:5173", // Update with your frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"], // Allow all HTTP methods
      allowedHeaders: ["Content-Type", "Authorization", "Origin", "X-Requested-With", "Accept"], // Allow headers
      credentials: true, // Allow sending cookies
    
  })
);

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

app.get("/test", (req, res) => {
  res.json("Auth Service working");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });
  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign(
        { userId: foundUser._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie("token", token, { sameSite: "none", secure: true }).json({
            id: foundUser._id,
          });
        }
      );
    } else {
      res.status(401).json("Invalid credentials");
    }
  } else {
    res.status(401).json("Invalid credentials");
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });
    jwt.sign(
      { userId: createdUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(201)
          .json({
            id: createdUser._id,
          });
      }
    );
  } catch (err) {
    res.status(500).json("Error creating user");
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", "", { sameSite: "none", secure: true }).json("ok");
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.listen(4001, () => {
  console.log("Auth Service running on port 4001");
});
