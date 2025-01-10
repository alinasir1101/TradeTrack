const port = 3000; // Server will run on port 3000
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

const serviceAccountPath = 'C:/Users/ali zain/Desktop/Coding/tradetrack-446815-63935468e39e.json';
const gStorage = new Storage({ keyFilename: serviceAccountPath });
const bucketName = 'tradetrack-bucket';
const bucket = gStorage.bucket(bucketName);

require('dotenv').config({ path: './private.env' });

const DB_URI = process.env.DB_URI;

const app = express();
console.log('Hi');

let currentTradeId = "none";
let currentURL;

// Middleware setup
app.use(cors({})); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON payloads in requests
app.use(express.json()); // Parse JSON payloads
app.use("/public", express.static(__dirname + "/public"));
app.use("/assets", express.static(__dirname + "/Assets"));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'main.html'));
});

// Connect to MongoDB Atlas
mongoose.connect(DB_URI).then(() => console.log('MongoDB connected'))
.catch((err) => console.log(err));

// Define User Schema and Mongoose Model
const userSchema = new mongoose.Schema({
    name: {type: String},
    email: {type: String, unique: true},
    password: {type: String},
    timeZone: {type: String},
    startegiesList: {type: Array}
});
const User = mongoose.model('User', userSchema);

// Strategies
const strategySchema = new mongoose.Schema({
    userId: {type: String},
    strategyName: {type: String},
    tradesList: {type: Array},
    visibleDat: {type: Array},
    numOfTrades: {type: Number},
    numOfProfitableTrades: {type: Number},
});
const Strategy = mongoose.model('Strategy', strategySchema);

// Trades
const tradeSchema = new mongoose.Schema({
    userId: {type: String},
    strategyId: {type: String},
    pairName: {type: String},
    outcome: {type: String},
    date: {type: Date},
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

// Upload image route
app.post('/api/upload', upload.single('image'), async (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const buffer = req.file.buffer;
    const destination = `uploads/hi-lol-${req.file.originalname}`;

    try {
        await uploadImage(buffer, destination);
        res.status(200).json({message: 'File uploaded to Cloud Storage! Trade ID', tradeID: 123});
    } catch (error) {
        res.status(500).send('Error uploading file: ' + error.message);
        return;
    }

    try {
        // Save to Database
        currentURL = "https://storage.googleapis.com/tradetrack-bucket/" + destination;
        const newTrade = await Trade.create({
            userId: "",
            strategyId: "",
            pairName: "EURUSD",
            outcome: "Profit",
            date: "",
            time: "",
            session: "",
            timeframe: "",
            RRR: "",
            orderType: "Limit",
            entryLevel: "",
            tp: "",
            sl: "",
            confluences: "",
            imageURL: currentURL
        });

        // Log the newTrade object for debugging
        console.log('New Trade:', newTrade);
    } catch (err) {
        console.log("Error saving data: ", err)
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});