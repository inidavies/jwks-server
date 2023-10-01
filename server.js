require('dotenv').config();
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

const PORT = 8080;
app.use(express.json());

// Define an array to store key pairs and their metadata
const keyPairs = [];
const posts  =[
    {
        username:'userABC',
        title:'Authentication Successful'
    }
]

app.get('/', (req, res) => {
    res.send(`Running on http://localhost:${PORT}`);
});

app.post('/auth', (req, res) => {
    //Authentication

    const username = req.body.username;
    const user = { name:username }

    const accessToken = generateAccessToken(user)
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
    res.json({ accessToken: accessToken, refreshToken: refreshToken });
});

app.get('/posts', verifyToken, (req, res) => {
    res.json(posts.filter(post => post.username === req.user.name));
});

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if(token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        console.log(err)

        if(err) return res.sendStatus(403)

        req.user = user

        next()
    })
}
function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15s'});
}

app.listen(8080)