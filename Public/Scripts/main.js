// const { options } = require("../../Server Files/apis");

const uploadBox = document.getElementById('img-container');
const fileInput = document.getElementById('file-input');
const browseButton = document.getElementById('browse-btn');
const browseButton2 = document.getElementById('browse-btn2');
const preview = document.getElementById('preview');
const menuButton = document.getElementById('menu-btn');
const setsList = document.getElementById('sets-list');
const sidebar = document.getElementById('sidebar');
const main = document.getElementById('main');
const sidebarHeader = document.getElementById('sidebar-header');
const closeSetsList = document.querySelector('.close-sets-list');
const addSet = document.getElementById('add-set');
const spawnSets = document.getElementById('spawn-sets');

const contentLoader = document.querySelector('.content-loader');
const sidebarLoader = document.querySelector('.sidebar-loader');

console.log("Hi! Welcome to TradeTrack.");

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const spawnTrades = document.getElementById('spawn-trades');
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

setsList.onclick = function () {
    main.style.display = "none";
    sidebar.style.display = "block";
    sidebar.style.width = "100%"
    sidebarHeader.style.width = "calc(100% - 10px)";
    closeSetsList.style.display = "inline-block";
}




// Display all previous trades when starting
async function fetchPreviousTrades () {
    try {
        contentLoader.style.display = 'block';
        const res = await axios.get('/api/previousTrades');
        previousTrades = res.data;
        console.log("Previous Trades: ", previousTrades);
        while (tradeCount <= previousTrades.length) {
            displayTrade(previousTrades[tradeCount-1]);
        }
        contentLoader.style.display = 'none';
    } catch (error) {
        console.error('Error fetching data: ', error);
    }
}


async function fetchPreviousTradesWithId (id) {
    try {
        contentLoader.style.display = 'block';
        const res = await axios.get(`/api/previousTradesWithId/${id}`);
        previousTrades = res.data;
        console.log("Previous Trades: ", previousTrades);
        while (tradeCount <= previousTrades.length) {
            displayTrade(previousTrades[tradeCount-1]);
        }
        contentLoader.style.display = 'none';
    } catch (error) {
        console.error('Error fetching data: ', error);
    }
}


fetchPreviousTrades();




addSet.onclick = async function () {

    document.querySelectorAll(".trade").forEach(el => el.remove());
    const res = await axios.get('/api/addNewSet');
    const data = res.data;
    console.log(data.newSetId);
    const setHTML = `<Button class="set" id="set-${data.newSetId}">New Set</Button>`;
    spawnSets.insertAdjacentHTML('afterend', setHTML);
    fetchPreviousTrades();

    setTimeout(() => {
        const setButton = document.getElementById(`set-${data.newSetId}`);
        document.querySelectorAll('.set').forEach(el => el.classList.remove("active-set"));
        setButton.classList.add("active-set");

        if (setButton) {
            setButton.onclick = async function () {
                document.querySelectorAll('.set').forEach(el => el.classList.remove("active-set"));
                setButton.classList.add("active-set");
                document.querySelectorAll(".trade").forEach(el => el.remove());
                const res = await axios.get(`/api/selectSet/${data.newSetId}`);
                console.log(res.data);
                tradeCount = 1;
                if (window.innerWidth <= 600) {
                    main.style.display = "block";
                    sidebar.style.display = "none";
                }
                await fetchPreviousTrades();
            };
        }
    }, 100);
}

closeSetsList.onclick = function () {
    main.style.display = "block";
    sidebar.style.display = "none";
}





confirmDelete.onclick = async function() {
    if (tradeIdToDelete) {
        try {
            const response = await fetch(`/api/deleteTrade/${tradeIdToDelete}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                console.log(`Trade ${tradeIdToDelete} deleted successfully`);
                document.getElementById(`trade-${tradeIdToDelete}`).remove();
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
                <div class="pair-txt data">Pair: 
                    <div class="pair-name value">${trade.pairName}</div>
                </div>

                <div class="outcome-txt data">Outcome: 
                    <button class="outcome value">Profit</button>
                </div>

                <div class="date-txt data">Date: 
                    <div class="date value">${trade.date}</div>
                </div>

                <div class="time-txt data">Time: 
                    <div class="time value">${trade.time}</div>
                </div>

                <div class="session-txt data">Session: 
                    <div class="session value">London</div>
                </div>

                <div class="rrr-txt">Risk-to-Reward Ratio: 
                    <div class="rrr value">1:2</div>
                </div>

                <div class="position-txt data">Position: 
                    <button class="position value">Long</button>
                </div>

                <div class="order-type-txt data">Order Type: 
                    <button class="order-type value">Limit Order</button>
                </div>

                <div class="entry-text data">Entry Level: 
                    <div class="entry value">1.23</div>
                </div>

                <div class="tp-txt data">TP Level: 
                    <div class="tp value">2.34</div>
                </div>

                <div class="sl-txt data">SL Level: 
                    <div class="sl value">1.04</div>
                </div>
                
                <div class="confluences-txt data">Confluences: 
                    <div class="confluences value">N/A</div>
                </div>
            </div>
                    
        </div>
        <div class="img-container"><img id="trade-img" src="${trade.imageURL}" alt="Trade"></div>
    </div>
    `;

    spawnTrades.insertAdjacentHTML('afterend', tradeHTML);
    tradeCount ++;


    // Add event listener for the delete button
    const deleteButton = document.querySelector(`#trade-${trade.tradeId} .delete`);
    deleteButton.addEventListener('click', () => {
        tradeIdToDelete = deleteButton.getAttribute('data-trade-id');
        deleteModal.style.display = 'block';
    });


}

// display all sets

async function displayPreviousSets() {
    sidebarLoader.style.display = 'block';
    const res = await axios.get('/api/getPreviousSets');
    const sets = res.data;
    console.log("Previous sets: ", sets);
    let count = 0;
    
    while ( count <= sets.length - 1) {
        const setId = sets[count].setId;
        const setName = sets[count].setName;
        const setHTML = `<Button class="set" id="set-${setId}">${setName}</Button>`;
        spawnSets.insertAdjacentHTML('afterend', setHTML);

        

        setTimeout(() => {
            const setButton = document.getElementById(`set-${setId}`);
            axios.get('/api/getUserInfo')
            .then(res => {
                const user = res.data;
                console.log("Current Set ID was: ", user.currentSetId);
                if (setId == user.currentSetId) {
                    setButton.classList.add("active-set");
                }
            })
            .catch(err => console.log("Error fetching User Info: ", err));
            
            

            

            if (setButton) {
                setButton.onclick = async function () {
                    console.log("Different Set Button Clicked: ", setButton, "Set ID: ", setId);
                    document.querySelectorAll('.set').forEach(el => el.classList.remove("active-set"));
                    setButton.classList.add("active-set");
                    document.querySelectorAll(".trade").forEach(el => el.remove());
                    const res = await axios.get(`/api/selectSet/${setId}`);
                    console.log(res.data);
                    tradeCount = 1;
                    if (window.innerWidth <= 600) {
                        main.style.display = "block";
                        sidebar.style.display = "none";
                    }
                    await fetchPreviousTradesWithId(setId);
                };
            }

            

        }, 100);
        count++;
    }
    sidebarLoader.style.display = 'none';
}

displayPreviousSets();

















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
    contentLoader.style.display = 'block';
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
    contentLoader.style.display = 'none';
}



