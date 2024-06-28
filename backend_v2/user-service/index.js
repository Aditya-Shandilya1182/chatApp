const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

app.get("/test", (req, res) => {
  res.send("User Service is working");
});

app.get("/people", async (req, res) => {
  const users = await User.find({}, { '_id': 1, username: 1 });
  res.json(users);
});

app.listen(4002, () => {
  console.log("User Service running on port 4002");
});
