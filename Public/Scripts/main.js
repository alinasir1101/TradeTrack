const uploadBox = document.getElementById('img-container');
const fileInput = document.getElementById('file-input');
const browseButton = document.getElementById('browse-btn');
const browseButton2 = document.getElementById('browse-btn2');
const preview = document.getElementById('preview');

console.log("Hi! Welcome to TradeTrack.");

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const contentSpace = document.getElementById('content-space');
let tradeCount = 1;
let previousTrades =[];







function displayTrade (trade) {
    const tradeHTML = `
    <div class="trade" id="trade">
        <div class="info">

            <div class="title">
                <div class="trade-num"><h3>Trade <span class="num">${tradeCount}</span></h3></div>
                <button class="edit"><img src="../Assets/Edit.png" alt="Edit"></button>
                <button class="delete"><img src="../Assets/Delete.png" alt=""></button>
            </div>
                    
            <div>
                <p>
                    <span class="pair-txt"><strong>Pair:</strong></span>
                    <span class="pair-name">${trade.pairName}</span>
                    <span class="space"></span>

                    <span class="outcome-txt"><strong>Outcome:</strong></span>
                    <span class="outcome"></span>
                    <span class="space"></span>

                    <span class="date-txt"><strong>Date:</strong></span>
                    <span class="date">${trade.date}</span>
                    <span class="space"></span>

                    <span class="time-txt"><strong>Time:</strong></span>
                    <span class="time">${trade.time}</span>
                    <span class="space"></span>

                    <span class="session-txt"><strong>Session:</strong></span>
                    <span class="session"></span>
                    <span class="space"></span>

                    <span class="rrr-txt"><strong>Risk-to-Reward Ratio:</strong></span>
                    <span class="rrr">1:2</span>
                    <span class="space"></span>

                    <span class="position-txt"><strong>Position:</strong></span>
                    <span class="position"></span>
                    <span class="space"></span>

                    <span class="order-type-txt"><strong>Order Type:</strong></span>
                    <span class="order-type">Limit Order</span>
                    <span class="space"></span>

                    <span class="entry-text"><strong>Entry Level:</strong></span>
                    <span class="entry"></span>
                    <span class="space"></span>

                    <span class="exit-txt"><strong>Exit Level:</strong></span>
                    <span class="exit"></span>
                    <span class="space"></span>

                    <span class="timeframe-txt"><strong>Timeframe:</strong></span>
                    <span class="timeframe">${trade.timeframe}</span>
                    <span class="space"></span>

                    <span class="confluences-txt"><strong>Confluences:</strong></span>
                    <span class="confluences"></span>
                </p>
            </div>
                    
        </div>
        <div class="img-container"><img id="trade-img" src="${trade.imageURL}" alt="Trade"></div>
    </div>
    `;

    contentSpace.insertAdjacentHTML('afterend', tradeHTML);
    tradeCount ++;

}






// Display all previous trades when starting

async function fetchPreviousTrades () {
    try {
        const res = await axios.get('/api/previousTrades');
        previousTrades = res.data;
        console.log("Previous Trades: ", previousTrades);
        while (tradeCount <= previousTrades.length) {
            displayTrade(previousTrades[tradeCount]);
        }
    } catch (error) {
        console.error('Error fetching data: ', error);
    }
}




fetchPreviousTrades();












// Images Input


// Trigger file input when "Browse" button is clicked
browseButton.addEventListener('click', () => {
    fileInput.click();
});


// Trigger file input when "Browse" button is clicked
browseButton2.addEventListener('click', () => {
    fileInput.click();
});

// Handle file input change
fileInput.addEventListener('change', (event) => {
    handleFiles(event.target.files);
});



// Handle drag & drop functionality
uploadBox.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadBox.classList.add('dragover');
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});

uploadBox.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadBox.classList.remove('dragover');

    handleFiles(event.dataTransfer.files);
});













// Function to handle multiple file uploads

function handleFiles(files) {
    const fileArray = Array.from(files); // Convert FileList to Array

    // Preview and upload each file
    fileArray.forEach((file) => {
        if (file.type.startsWith('image/')) {

            // // Preview the image
            // const reader = new FileReader();
            // reader.onload = (e) => {
            //     const img = document.createElement('img');
            //     img.src = e.target.result;
            //     img.alt = 'Preview';
            //     preview.appendChild(img);
            // };
            // reader.readAsDataURL(file);

            



            const formData = new FormData();
            formData.append('image', file);

            
            // Simulate file upload (replace with actual server endpoint)
            fetch('/api/upload', {
                method: 'POST',
                body: formData,
                // mode: 'no-cors'
            })
            
                .then(response => {
                // Ensure the response is ok
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json(); // Parse the JSON from the response
                })
                .then((data) => {
                    console.log(`File "${file.name}" uploaded successfully!`, data);
                    const newTrade = data;
                    console.log(`Trade: ${newTrade}, Image: ${newTrade.imageURL}`);
                    displayTrade(newTrade);
                })
                .catch(error => {
                    console.error(`Error uploading file "${file.name}":`, error);
                });

        } else {
            alert(`"${file.name}" is not a valid image file.`);
        }
        

        
    });
}



