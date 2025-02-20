const uploadBox = document.getElementById('img-container');
const fileInput = document.getElementById('file-input');
const browseButton = document.getElementById('browse-btn');
const browseButton2 = document.getElementById('browse-btn2');
const preview = document.getElementById('preview');
const menuButton = document.getElementById('menu-btn')

console.log("Hi! Welcome to TradeTrack.");

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const contentSpace = document.getElementById('content-space');
let tradeCount = 1;
let previousTrades =[];


const deleteModal = document.getElementById('deleteModal');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');
let tradeIdToDelete = null;


cancelDelete.onclick = function() {
    deleteModal.style.display = 'none';
};

window.onclick = function(event) {
    if (event.target == deleteModal) {
        deleteModal.style.display = 'none';
    }
};


menuButton.onclick = function() {
    window.location.href = "/menu"
}









confirmDelete.onclick = async function() {
    if (tradeIdToDelete) {
        try {
            const response = await fetch(`/api/deleteTrade/${tradeIdToDelete}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log(`Trade ${tradeIdToDelete} deleted successfully`);
                location.reload();
            } else {
                console.error(`Failed to delete trade ${tradeIdToDelete}`);
            }
        } catch (error) {
            console.error(`Error deleting trade ${tradeIdToDelete}:`, error);
        } finally {
            deleteModal.style.display = 'none';
        }
    }
};






function displayTrade (trade) {
    const tradeHTML = `
    <div class="trade" id="trade-${trade.tradeId}">
        <div class="info">

            <div class="title">
                <div class="trade-num"><h3>Trade <span class="num">${tradeCount}</span></h3></div>
                <button class="edit"><img src="../Assets/Edit.png" alt="Edit"></button>
                <button class="delete" data-trade-id="${trade.tradeId}"><img src="../Assets/Delete.png" alt=""></button>
            </div>
                    
            <div class="details">
                <div class="pair-txt data">Pair: <div class="pair-name value">${trade.pairName}</div></div>

                <div class="outcome-txt data">Outcome: <button class="outcome value">Profit</button></div>

                <div class="date-txt data">Date: <div class="date value">${trade.date}</div></div>

                <div class="time-txt data">Time: <div class="time value">${trade.time}</div></div>

                <div class="session-txt data">Session: <div class="session value">London</div></div>

                <div class="rrr-txt">Risk-to-Reward Ratio: <div class="rrr value">1:2</div></div>

                <div class="position-txt data">Position: <button class="position value">Long</button></div>

                <div class="order-type-txt data">Order Type: <button class="order-type value">Limit Order</button></div>

                <div class="entry-text data">Entry Level: <div class="entry value">1.23</div></div>

                <div class="exit-txt data">Exit Level: <div class="exit value">2.34</div></div>

                <div class="timeframe-txt data">Timeframe: <div class="timeframe value">${trade.timeframe}</div></div>

                <div class="confluences-txt data">Confluences: <div class="confluences value">Double top</div></div>
            </div>
                    
        </div>
        <div class="img-container"><img id="trade-img" src="${trade.imageURL}" alt="Trade"></div>
    </div>
    `;

    contentSpace.insertAdjacentHTML('afterend', tradeHTML);
    tradeCount ++;


    // Add event listener for the delete button
    const deleteButton = document.querySelector(`#trade-${trade.tradeId} .delete`);
    deleteButton.addEventListener('click', () => {
        tradeIdToDelete = deleteButton.getAttribute('data-trade-id');
        deleteModal.style.display = 'block';
    });


}






// Display all previous trades when starting

async function fetchPreviousTrades () {
    try {
        const res = await axios.get('/api/previousTrades');
        previousTrades = res.data;
        console.log("Previous Trades: ", previousTrades);
        while (tradeCount <= previousTrades.length) {
            displayTrade(previousTrades[tradeCount-1]);
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

async function handleFiles(files) {
    const fileArray = Array.from(files); // Convert FileList to Array

    // Sequentially upload each file
    for (const file of fileArray) {
        if (file.type.startsWith('image/')) {
            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                console.log(`File "${file.name}" uploaded successfully!`, data);
                const newTrade = data;
                console.log(`Trade: ${newTrade}, Image: ${newTrade.imageURL}`);
                displayTrade(newTrade);
            } catch (error) {
                console.error(`Error uploading file "${file.name}":`, error);
            }
        } else {
            alert(`"${file.name}" is not a valid image file.`);
        }
    }
}



