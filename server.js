const port = process.env.PORT || 3000; // Use the port provided by Render or default to 3000
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: './private.env' });

// User Auth
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// Set up Google Cloud
let credentials;
try {
    credentials = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf-8'));
} catch (error) {
    console.error("Error parsing GOOGLE_CREDENTIALS_JSON:", error);
    process.exit(1); // Exit the process with a non-zero status code
}

// Google Cloud Storage
const { Storage } = require('@google-cloud/storage');
const gStorage = new Storage({ credentials });
const bucketName = "tradetrack-bucket";
const bucket = gStorage.bucket(bucketName);

// Google Cloud Vision
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient({ credentials });





const app = express();
console.log('Hi');

let currentTradeId = "none";
let currentURL;

// Middleware setup
app.use(cors({})); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON payloads in requests
app.use(express.json()); // Parse JSON payloads
app.use("/public", express.static(__dirname + "/Public"));
app.use("/assets", express.static(__dirname + "/Assets"));
app.use(passport.initialize());





// DB
const DB_URI = process.env.DB_URI;

// Connect to MongoDB Atlas
mongoose.connect(DB_URI).then(() => console.log('MongoDB connected'))
.catch((err) => console.log(err));

// Define User Schema and Mongoose Model
const userSchema = new mongoose.Schema({
    userId: {type: Number},
    name: {type: String},
    email: {type: String, unique: true},
    password: {type: String},
    googleId: {type: String},
    timeZone: {type: String},
    startegiesList: {type: Array},
    lastStrategyId: {type: Number}
});
const User = mongoose.model('User', userSchema);

// Strategies
const strategySchema = new mongoose.Schema({
    strategyId: {type: Number},
    userId: {type: Number},
    strategyName: {type: String},
    tradesList: {type: Array},
    visibleData: {type: Array},
    numOfTrades: {type: Number},
    numOfProfitableTrades: {type: Number},
    lastTradeId: {type: Number}
});
const Strategy = mongoose.model('Strategy', strategySchema);

// Trades
const tradeSchema = new mongoose.Schema({
    tradeId: {type: Number},
    strategyId: {type: Number},
    userId: {type: Number},
    pairName: {type: String},
    outcome: {type: String},
    date: {type: String},
    time: {type: String},
    session: {type: String},
    timeframe: {type: String},
    RRR: {type: String},
    orderType: {type: String},
    entryLevel: {type: Number},
    tp: {type: Number},
    sl: {type: Number},
    confluences: {type: Array},
    imageURL: {type: String}
});
const Trade = mongoose.model('Trade', tradeSchema);




// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



let tradeId;
let strategyId = 1;
let userId = 1;
let pairName;
let outcome;
let date;
let time;
let session;
let timeframe;
let RRR;
let orderType;
let entryLevel;
let tp;
let sl;
let confluences;
let imageURL;















// --------------------------- User Auth












// Passport JWT Strategy
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    User.findById(jwt_payload.id, (err, user) => {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
}));

// Passport Google OAuth Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // CHANGED: Using async/await instead of callbacks for Mongoose queries
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = new User({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));


// JWT Middleware
const jwtMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.redirect('/login');
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.redirect('/login');
        }
        req.userId = decoded.id;
        next();
    });
};

// Routes
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        name,
        email,
        password: hashedPassword
    });

    try {
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Email already exists' });
    }
});

app.post('/login', async (req, res) => {
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
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    const payload = { id: req.user.id, name: req.user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.redirect(`/?token=${token}`);
});

app.get('/', jwtMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'main.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'signup.html'));
});













// -------------------------------- Functions










// Function to upload a file to Google Cloud Storage
async function uploadImage(buffer, destination) {
    try {
        const file = bucket.file(destination);
        await file.save(buffer, {
            resumable: false,
            metadata: {
                cacheControl: 'no-cache', // Optional
            },
        });
        console.log(`File uploaded to ${bucketName}/${destination}`);
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}




// Extract Text from Screenshot
async function extractText(imagePath) {
    // Read image and send it to Google Vision API
    const [result] = await client.textDetection(imagePath);
    const texts = result.textAnnotations;

    if (!texts.length) {
        console.log("No text found.");
        return null;
    }

    console.log("Extracted Text:");
    let textString = texts.map(text => text.description).join(" ");
    // console.log(textString);


    // Extract date
    const dateMatch = textString.match(/,\s*([A-Za-z]+ \d{2}, \d{4})/);
    date = dateMatch ? dateMatch[1] : null;

    // Extract time
    const timeMatch = textString.match(/(\d{2}:\d{2})\s+UTC/);
    time = timeMatch ? timeMatch[1] : null;

    // Extract pair name
    const pairNameMatch = textString.match(/\n(.+?),/);
    pairName = pairNameMatch ? pairNameMatch[1] : null;

    // Extract timeframe (handles 5, 1h, 4h, 1D, 1W, etc.)
    const timeframeMatch = textString.match(/\n[^,]+,\s*([\w\d]+)/);
    timeframe = timeframeMatch ? timeframeMatch[1] : null;

    console.log({ date, time, pairName, timeframe });





    // return texts.map(text => text.description);
}


















// -------------------------------- APIs









// Previous Trades

app.get('/api/previousTrades', (req, res) => {
    Trade.find()
    .then(trades => {
        res.json(trades);
    })
    .catch(err => {
        console.error('Error fetching trades from database: ', err);
    });

});






// Upload image route
app.post('/api/upload', upload.single('image'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }





    // Read and Update lastTradeId
    try {
        let strategy = await Strategy.findOneAndUpdate(
            { userId: userId, strategyId: strategyId },
            { $inc: { lastTradeId: 1 } },
            { new: true, upsert: true } // Create the document if it doesn't exist
        );
    
        tradeId = strategy.lastTradeId;
    
        console.log('Update Successful');
    } catch (err) {
        console.error('Error:', err);
    }







    // Upload to Cloud Storage
    const buffer = req.file.buffer;
    const destination = `uploads/${tradeId}-${req.file.originalname}`;

    try {
        await uploadImage(buffer, destination);
    } catch (error) {
        res.status(500).send('Error uploading file: ' + error.message);
        return;
    }

    

    
    



    
    // Extract Info from Image
    currentURL = "https://storage.googleapis.com/tradetrack-bucket/" + destination;
    await extractText(currentURL).catch(console.error);




    // Save to Database
    try {

        const newTrade = await Trade.create({
            tradeId: tradeId,
            strategyId: strategyId,
            userId: userId,
            pairName: pairName,
            outcome: "",
            date: date,
            time: time,
            session: "",
            timeframe: timeframe,
            RRR: "1:2",
            orderType: "Limit",
            entryLevel: "",
            tp: "",
            sl: "",
            confluences: "",
            imageURL: currentURL
        });

        // Log the newTrade object for debugging
        console.log('New Trade:', newTrade);
        res.status(200).json(newTrade);

    } catch (err) {
        console.log("Error saving data: ", err)
    }
});








// Delete trade route
app.delete('/api/deleteTrade/:tradeId', async (req, res) => {
    const tradeId = req.params.tradeId;

    try {
        await Trade.deleteOne({ tradeId: tradeId });
        res.status(200).json({ message: 'Trade deleted successfully' });
    } catch (error) {
        console.error('Error deleting trade:', error);
        res.status(500).json({ error: 'Failed to delete trade' });
    }
});








app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});