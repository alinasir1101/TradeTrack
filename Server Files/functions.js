const { System, User, Set, Trade } = require('./models');
require('dotenv').config('../.env');
const jwt = require('jsonwebtoken');

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


let tradeId;
let setId = 1;
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

let tradeData = {
    tradeId,
    setId,
    userId,
    pairName,
    outcome,
    date,
    time,
    session,
    timeframe,
    RRR,
    orderType,
    entryLevel,
    tp,
    sl,
    confluences,
    imageURL
}










const userMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.token; // Extract token from cookie

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify and decode token
        const userId = decoded.id;

        const user = await User.findById(userId); // Await user fetch from DB
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user; // Attach user info to req object - just assign req.user to var in any route

        next(); 

    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};









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
    tradeData.date = dateMatch ? dateMatch[1] : null;

    // Extract time
    const timeMatch = textString.match(/(\d{2}:\d{2})\s+UTC/);
    tradeData.time = timeMatch ? timeMatch[1] : null;

    // Extract pair name
    const pairNameMatch = textString.match(/\n(.+?),/);
    tradeData.pairName = pairNameMatch ? pairNameMatch[1] : null;

    // Extract timeframe (handles 5, 1h, 4h, 1D, 1W, etc.)
    const timeframeMatch = textString.match(/\n[^,]+,\s*([\w\d]+)/);
    tradeData.timeframe = timeframeMatch ? timeframeMatch[1] : null;

    console.log( tradeData.date, tradeData.time, tradeData.pairName, tradeData.timeframe );


    // return texts.map(text => text.description);
}



module.exports = {
    userMiddleware,
    uploadImage,
    extractText,
    tradeData
}

