const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { System, User, Set, Trade } = require('./models');
require('dotenv').config('../.env');


const express = require('express');
const router = express.Router();


// Passport JWT Strategy
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;




const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        const user = await User.findById(jwt_payload.id);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (err) {
        return done(err, false);
    }
}));

// JWT Middleware
const jwtMiddleware = (req, res, next) => {
    // gets token from browser's cookies
    const token = req.cookies?.token; // '?' Optional chaining to prevent errors
    
    if (!token) { 
        console.log('No Token');
        return res.redirect('/login');
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('User not authorised');
            return res.redirect('/login');
        }
        console.log('Token verified, user authorized');
        req.userId = decoded.id;
        next();
    });
};







// Routes
router.post('/register', async (req, res) => {
    const { name, email, password, country, dateJoined } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const lastUserId = await System.findOneAndUpdate(
        { name : "lastUserId" },
        { $inc: {value: 1}},
        {new:true, upsert:true}
    );
    const userId = lastUserId.value;

    
    const newUser = new User({
        userId,
        name,
        email,
        password: hashedPassword,
        country,
        dateJoined,
        currentSetId: 1,
        setsList: [1],
        lastSetId: 1,
        invites: 0,
        membership: {
            level: "Free",
            totalMonths: 0
        }
    });

    try {
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Email already exists' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const payload = { id: user.id, name: user.name };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
        // Server-side (Express.js with `cookie-parser`)
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,  // Use HTTPS
            sameSite: "strict", // Prevent CSRF
            maxAge: 30 * 24 * 60 * 60 * 1000 // 1 day
        });

        res.json({ token });
    } catch (error) {
        console.log('Error logging in: ', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie("token", {  
        httpOnly: true,  
        secure: true,  
        sameSite: "strict",  
        path: "/" // Ensure path matches the one set in `res.cookie()`
    });  
    res.status(200).json({ message: "Logged out" });
});


module.exports = {
    router,
    jwtMiddleware
}

