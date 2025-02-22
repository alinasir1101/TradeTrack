const port = process.env.PORT || 3000; // Use the port provided by Render or default to 3000
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cookieParser = require("cookie-parser");
require('dotenv').config();
const passport = require('passport');


const apiRoutes = require('./Server Files/apis');
const { router: authRoutes, jwtMiddleware } = require('./Server Files/user-auth');





const app = express();
console.log('Hi');


// Middleware setup
app.use(cors({
    credentials: true // Allow cookies
})); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON payloads in requests
app.use(express.json()); // Parse JSON payloads
app.use("/public", express.static(__dirname + "/Public"));
app.use("/assets", express.static(__dirname + "/Assets"));
app.use(passport.initialize());
app.use(cookieParser()); // Required to read cookies

app.use('/api', apiRoutes);
app.use('/api', authRoutes);








app.get('/', jwtMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'main.html'));
});


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'signup.html'));
});


app.get('/menu', jwtMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'menu.html'));
});






app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});