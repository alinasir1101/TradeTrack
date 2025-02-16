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



const DB_URI = process.env.DB_URI;

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



let tradeId = 1;
let strategyId = 1;
let userId = 1;













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
function extractText(imagePath) {
    // Read image and send it to Google Vision API
    const [result] = client.textDetection(imagePath);
    const texts = result.textAnnotations;

    if (!texts.length) {
        console.log("No text found.");
        return null;
    }

    console.log("Extracted Text:");
    console.log(texts.map(text => text.description).join("\n"));

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
    extractText(currentURL).catch(console.error);




    // Save to Database
    try {

        const newTrade = await Trade.create({
            tradeId: tradeId,
            strategyId: strategyId,
            userId: userId,
            pairName: "",
            outcome: "",
            date: "",
            time: "",
            session: "",
            timeframe: "",
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