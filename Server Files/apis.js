const express = require('express');
const router = express.Router();

const { userMiddleware, uploadImage, extractText, tradeData } = require('./functions');

const { System, User, Set, Trade } = require('./models');


// Set up multer storage
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });









// Get User Info from Cookie token
router.get("/getUserInfo", userMiddleware, (req, res) => {
    let user = req.user;
    res.json(user);
});






// Previous Trades

router.get('/previousTrades', userMiddleware, (req, res) => {
    let user = req.user;
    Trade.find({ userId: user.userId, setId: user.currentSetId })
    .then(trades => {
        res.json(trades);
    })
    .catch(err => {
        console.error('Error fetching trades from database: ', err);
    });

});




// Previous Trades with Set ID

router.get('/previousTradesWithId/:setId', userMiddleware, (req, res) => {
    const setId = req.params.setId;
    let user = req.user;

    Trade.find({ userId: user.userId, setId: setId })
    .then(trades => {
        res.json(trades);
    })
    .catch(err => {
        console.error('Error fetching trades from database: ', err);
    });

});























// Upload image route
router.post('/upload', userMiddleware, upload.single('image'), async (req, res) => {
    const file = req.file;
    const user = req.user;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }



    // Read and Update Set

    const set = await Set.findOne({ userId: user.userId, setId: user.currentSetId});

    if (!set) {
        console.error("Error: Set not found");
        return res.status(404).json({ error: "Set not found" }); // Exit function to prevent crash
    }
    console.log("Set details: ", set);

    let lastTradeId = set.lastTradeId + 1; 
    console.log('last trade Id: ', lastTradeId);
    let tradesList = set.tradesList;
    let numOfTrades = set.numOfTrades + 1;

    tradesList.push(lastTradeId);


    try {
        await Set.updateOne({ userId: user.userId, setId: user.currentSetId}, {lastTradeId, tradesList, numOfTrades});
    } catch (err) {
        console.error('Error:', err);
    }



    // Upload to Cloud Storage
    const buffer = req.file.buffer;
    const destination = `uploads/${lastTradeId}-${user.userId}-${req.file.originalname}`;

    try {
        await uploadImage(buffer, destination);
    } catch (error) {
        res.status(500).send('Error uploading file: ' + error.message);
        return;
    }

    


    
    // Extract Info from Image
    tradeData.currentURL = "https://storage.googleapis.com/tradetrack-bucket/" + destination;
    await extractText(tradeData.currentURL).catch(console.error);




    // Save to Database
    try {

        const newTrade = await Trade.create({
            tradeId: lastTradeId, // stuck
            setId: user.currentSetId,
            userId: user.userId,
            pairName: tradeData.pairName,
            outcome: "None",
            date: tradeData.date,
            time: tradeData.time,
            session: "",
            timeframe: tradeData.timeframe,
            RRR: "1:2",
            orderType: "Limit",
            entryLevel: "",
            tp: "",
            sl: "",
            confluences: "",
            imageURL: tradeData.currentURL
        });

        // Log the newTrade object for debugging
        console.log('New Trade:', newTrade);
        res.status(200).json(newTrade);

    } catch (err) {
        console.log("Error saving data: ", err)
    }
});




























// Delete trade route
router.delete('/deleteTrade/:tradeId', userMiddleware, async (req, res) => {
    const tradeId = req.params.tradeId;
    const user = req.user;

    try {
        await Trade.deleteOne({ tradeId: tradeId, userId: user.userId, setId: user.currentSetId });
        res.status(200).json({ message: 'Trade deleted successfully' });
    } catch (error) {
        console.error('Error deleting trade:', error);
        res.status(500).json({ error: 'Failed to delete trade' });
    }
});













// Add new set

router.get('/addNewSet', userMiddleware, async (req, res) => {
    const user = req.user;

    const newSetId = user.lastSetId + 1;

    const lastSetId = newSetId;
    const currentSetId = newSetId;
    let setsList = user.setsList;
    setsList.push(newSetId);

    User.updateOne({ userId: user.userId }, { lastSetId, currentSetId, setsList})
    .then(result => {
        console.log('Set Data Update Successful');
    })
    .catch(err => {
        console.error('Error Updating Set Data:', err);
    });


    Set.create({
        setId: newSetId,
        userId: user.userId,
        setName: "New Set",
        visibleData: ["pairName", "outcome", "date", "time", "session", "timeframe", "RRR", "position", "ordertype", "entryLevel", "tp", "sl", "confluences"],
        numOfTrades: 0,
        lastTradeId: 0,
        numOfProfitableTrades: 0,
        numOfLosingTrades: 0
    })
    .then((savedData) => {
        console.log('Set Data saved successfully:', savedData);
    })
    .catch((error) => {
        console.error('Error saving set data:', error);
    });



    console.log(newSetId);
    res.json({ newSetId });

});


















// Update currentSetId
router.get('/selectSet/:setId', userMiddleware, (req, res) => {
    
    const setIdString = req.params.setId;
    console.log('Params: ', setIdString);
    const user = req.user;

    const currentSetId = parseInt(setIdString, 10);

    User.updateOne({ userId: user.userId }, { currentSetId })
    .then(result => {
        console.log('Current Set ID Update Successful: ', result);
        res.json({ currentSetId: result });
    })
    .catch(err => {
        console.error('Error Updating Current Set ID:', err);
        res.json({ Error: err});
    });

});

















// get all previous sets to be displayed

router.get('/getPreviousSets', userMiddleware, async (req, res) => {
    const user = req.user;
    const setsList = user.setsList;
    let count = 0;
    let sets = [];

    while (count <= setsList.length - 1) {
        await Set.findOne({ userId: user.userId, setId: setsList[count] })
        .then(set => {
            // console.log('Set:', set)
            const setName = set.setName; 
            sets.push({ setId: setsList[count], setName: setName });
        })
        .catch(err => {
            console.error('Error Fetching Set:', err);
        });

        
        count ++;
    }

    // console.log("All sets: ", sets);

    res.json(sets);
});




router.post('/updateOutcome', userMiddleware, async (req, res) => {
    const data = req.body;
    const user = req.user;

    const outcomeUpdate = await Trade.updateOne({ userId: user.userId, setId: user.currentSetId, tradeId: data.tradeId },
    { outcome: data.outcome });
    res.json(outcomeUpdate);
});




module.exports = router;


