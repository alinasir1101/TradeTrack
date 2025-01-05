const port = 3000; // Server will run on port 3000
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: './private.env' });

const DB_URI = process.env.DB_URI;

const app = express();
console.log('Hi');

// Middleware setup
app.use(cors({})); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON payloads in requests
app.use(express.json()); // Parse JSON payloads
app.use(express.static(path.join(__dirname, 'Public', 'styles', 'main.css')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Views', 'main.html'))
});







// Connect to MongoDB Atlas
mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });







// Upload image route
app.post('/upload', upload.single('image'), (req, res) => {
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }







    // const uploadStream = gfsBucket.openUploadStream(file.originalname, {
    //     contentType: file.mimetype
    // });

    // uploadStream.on('error', (err) => {
    //     console.error('Error writing file to GridFS:', err);
    //     res.status(500).json({ error: 'Error writing file to GridFS' });
    // });

    // uploadStream.on('finish', (savedFile) => {
    //     res.json({
    //         message: 'File uploaded successfully',
    //         file: {
    //             id: savedFile._id,
    //             filename: savedFile.filename,
    //             contentType: savedFile.contentType
    //         }
    //     });
    // });

    // uploadStream.end(file.buffer);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


