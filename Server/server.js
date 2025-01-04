const port = 3000; // Server will run on port 3000
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const Grid = require("gridfs-stream");
const { MongoClient, ObjectId } = require('mongodb'); // Import ObjectId from mongodb
require('dotenv').config({path: './uri.env'});

const DB_URI = process.env.DB_URI;


const app = express();
console.log('Hi');

// Middleware setup
app.use(cors({
    origin: 'http://127.0.0.1:5500'
  })); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON payloads in requests
app.use(express.json()); // Parse JSON payloads










// Connect to MongoDB Atlas
mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Initialize GridFS Stream
let gfs;
mongoose.connection.once('open', () => {
    gfs = Grid(mongoose.connection.db, mongoose.mongo);
    gfs.collection('uploads');
});

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload image route
app.post("/upload", upload.single("image"), (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    // Create a stream to store the image in GridFS
    const writestream = gfs.createWriteStream({
        filename: file.originalname,
        content_type: file.mimetype
    });

    writestream.on("close", (savedFile) => {
        res.json({
            message: "File uploaded successfully",
            file: savedFile
        });
    });

    writestream.write(file.buffer);
    writestream.end();
});









app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});