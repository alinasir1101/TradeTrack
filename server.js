const port = process.env.PORT || 3000; // Use the port provided by Render or default to 3000
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: './private.env' });


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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'main.html'));
});



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
    timeZone: {type: String},
    startegiesList: {type: Array}
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



let tradeId = 1;
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








app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});