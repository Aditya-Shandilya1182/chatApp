const express = require('express');

const app = express();
const mongo_url = "mongodb+srv://adityashandilya1812:jcpprrs6543@cluster0.j0risrr.mongodb.net/?retryWrites=true&w=majority";

app.get('/test', (req,res) => {
    res.json("test ok");
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

app.listen(3000, () => {
    console.log("Server is running .....");
});