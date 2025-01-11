const port = 3000; // Server will run on port 3000
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: './private.env' });

// Set up Google Cloud Storage
const { Storage } = require('@google-cloud/storage');
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
const gStorage = new Storage({ keyFilename: credentials });
const bucketName = process.env.BUCKET_NAME;
const bucket = gStorage.bucket(bucketName);



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

// heroku config:set GOOGLE_APPLICATION_CREDENTIALS_JSON="ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAidHJhZGV0cmFjay00NDY4MTUiLAogICJwcml2YXRlX2tleV9pZCI6ICI2MzkzNTQ2OGUzOWU2ZTc0MDc3MDFiNzJmZjkyZGU1MDRkOTlmODcyIiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdmdJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLZ3dnZ1NrQWdFQUFvSUJBUUNaQ25qSXEzUWxDT2Y4XG5ZUVI1Zzc1MTRiTVNuMlowOUZKWEVmbVhmSkhxRU1zRitxOTV2eVh0ZEdVSDJORkNMZzNJVzljai9YZDA2UEpSXG4rcjM3MVE0UDdhNHMvNVhOY1NnQ3dtaXJyNGVTL1c5UUJueWl4OTgzbmp2QzIzTEJJUkptVkk2UEw2MDBBMDl2XG5KNURhb0FvZWg4TVdFN1lkMURzZUdOUkM0RVRrWVpGeXBqa2JxMWZDd3A0KzhtbjJES2tzaUxrcmhaNkMvbDM5XG5aSFkwWTNGYmhrNUkzMmh2QUd3SzdyaVY3cnJYYWRTTW85enFjazRUYmcxZlJsZFpBV1Q0d3M0SU9iZHFCRDNDXG5Pd0RJSDlnQzMxbUVRWXhVQWljWW5yd3RyMm9UeW15NGZtcVljRFFsbHNFU1ZSZ3Q3Q2RWM1ZnaVA5QkVuZVhJXG42OWlRMHY3VkFnTUJBQUVDZ2dFQUU3YXZuRm5KbWtPdGJtc280bVpBRUh0RVQrL01pT0E0QXhORHJXblVlZXd6XG4yczlSNzBMYUpkNUtiVnBXaWtuWWFLaTc2OXpvbUZ5eGFqSDhhd1lreTVSNFRUK1hFbUd6SDdmZk44NWlqbUtyXG5CZ252NENBUzl0MGhJWmFYRDUycyt4V0ZUNWg2blNxWC90OS8zMG1pUkJDRTVzRWZRblJtTVJoTnIxZW9TQ3ErXG5HNlBYOG5XdmM4S2V3QmtNdzU3QVM2YlkycmZkSG9Nem5LdDV6MGY1ZHVqMmszSytQbGdSdWIyYW9VWHcvdmk2XG50U1llbG81NTB5RFA4dTRNTnJiaHpkV2J3SFVpOHNRQVlvZThNWnBNbWZ4bEUwOGZFUjhEQy90QUdYUkgzanhDXG4waS9zNEZKQ3NUb2h0Q3JGZ0dVY1EwdERrMVBxYUtoeUtPd0dPY2V1QVFLQmdRRFg4WUluNGp0bVlVN0VvOE1jXG5nYVpmbHJVdTMrSkk4bU0zUkd6NjhxYStyVnYwbXlnNG1GVlVUZU05Ui9QVElEWE1tS0hIN21iZ0d6SkthV2IvXG5JR21ScTV4QWx5STZyNU5pSTQzTjRvMG80ckdSa0sxRlIyckc1R09SUGp0NUt6aDlPU2dtUjRmNzV2L1NCVDNCXG5tUHNGZjUyaGpadWwxZzY3bmZsZUV4ZXFGUUtCZ1FDMWJlcWxJMjdMRVRZbmhNQXF6Y0FjZ3I5ek00bmQxUUl3XG51OGpFWUc2ZXN5K3orUUIxMnZjRitWbTFNcXV3YjhSVE9QRHRIaGpoMGs3MFpiV2syOFJEOXpxRXhGWUkxS3hSXG4zcGpjQWJNQS9rNXdVb3krNG5BUjc3L09EMmRKTXEzc1pBV3hTNGtYVTlvNTRoT1dpQUZPT0VXdzdCemRrbkFHXG40NTVEUHVieHdRS0JnUUN0N3EzcVdCT0dKQ3lnd0ZMZ2ZDRTQ3eGZpdUp2NEs1djBvUjJ5aDQzOUdYOXVweWFmXG5aenVibXR6RXVGYlJJQ21WTVA5bUhVVXBqMTVUaDFCWmdJN25zVFU2NVVEQnlqZkpIV0FUakQ0c3gyTkZIeVloXG5IaVFJTFY5eFZwSHF5QUJKQktldEpZS0hTSW1YYlhkUG4xdlpFdkF4ZHZEK2cwcjhuWUtFM3BYNS9RS0JnRFJzXG5tMlcyVkZoWEU5ZmRjdzJyUUR5OHh3ZEp1Q2VpV2l5c3hqbUFSOWFSbmxJWnZEbFIyUmtmMFAwYnRDS2FXUmRYXG5GNzdjZUlJZ0cvSmd4VmpxcTg2YnpJdjZrNFdmdGw4OXU5dXVuZ1BHZC9IYTJKSjdxYmgxRjI0Nll6VHljUEVpXG5nY2FXTmZuSW9BRWp3MWMyMjNHM3J1T05obFc3NzZUOTlvZ2x6K1BCQW9HQkFLRUpWNDlCV3lIZkpHSFVtN2pxXG5HLzZhQW9aSENiMzBCL0RXcTBTc2hkUHdMTmgyTEI2RE1yUFFkMWJ4NDF2Zm9OSlJtaFQ3RU80SFJyZkZMWU1pXG5ZMkJRVkliUVJpNzhVQXpCTklmWVQ1azU1dlRSQkxVSzRtL1lhSGk5T1V2T1crVk5VcUloWUh2dGlLbXhXc3NSXG50TVpxWSt2bklaaUNkQ2c0SHE0bEhEYndcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJ0cmFkZXRyYWNrLXNlcnZpY2UtYWNjb3VudEB0cmFkZXRyYWNrLTQ0NjgxNS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMTQ4MzYzNzQzMTE3OTk1MjUwOTQiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L3RyYWRldHJhY2stc2VydmljZS1hY2NvdW50JTQwdHJhZGV0cmFjay00NDY4MTUuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K"





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
    const destination = `uploads/${tradeId}-${req.file.originalname}`;

    try {
        await uploadImage(buffer, destination);
    } catch (error) {
        res.status(500).send('Error uploading file: ' + error.message);
        return;
    }

    try {
        // Save to Database
        currentURL = "https://storage.googleapis.com/tradetrack-bucket/" + destination;
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