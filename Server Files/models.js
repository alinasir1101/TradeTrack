require('dotenv').config('../.env');
const mongoose = require('mongoose');


// DB
const DB_URI = process.env.DB_URI;

// Connect to MongoDB Atlas
mongoose.connect(DB_URI).then(() => console.log('MongoDB connected'))
.catch((err) => console.log(err));

const systemSchema = new mongoose.Schema({
    name: {type: String},
    value: {type: Number},
    string: {type: String}
});

// Define User Schema and Mongoose Model
const userSchema = new mongoose.Schema({
    userId: {type: Number},
    name: {type: String},
    email: {type: String, unique: true},
    password: {type: String},
    country: {type: String},
    dateJoined: {type: Date},

    currentSetId: {type: Number},   // Current set that is selected and displayed
    setsList: {type: Array},    // IDs of sets
    lastSetId: {type: Number},

    invites: {type: Number},
    membership: {
        level: String,
        startDate: Date,
        totalMonths: Number
    }
});

// Strategies
const setSchema = new mongoose.Schema({
    setId: {type: Number},
    userId: {type: Number},
    setName: {type: String},

    tradesList: {type: Array},
    visibleData: {type: Array}, // Trades data like order type etc
    numOfTrades: {type: Number},
    numOfProfitableTrades: {type: Number},
    numOfLosingTrades: {types: Number},
    lastTradeId: {type: Number}
});

// Trades
const tradeSchema = new mongoose.Schema({
    tradeId: {type: Number},
    setId: {type: Number},
    userId: {type: Number},
    
    pairName: {type: String},
    outcome: {type: String},
    date: {type: String},
    time: {type: String},
    session: {type: String},
    timeframe: {type: String},
    RRR: {type: String},
    position: {type: String},
    orderType: {type: String},
    entryLevel: {type: Number},
    tp: {type: Number},
    sl: {type: Number},
    confluences: {type: Array},
    imageURL: {type: String}
});




module.exports = {
    System: mongoose.model('System', systemSchema),
    User: mongoose.model('User', userSchema),
    Set: mongoose.model('Set', setSchema),
    Trade: mongoose.model('Trade', tradeSchema)
}



