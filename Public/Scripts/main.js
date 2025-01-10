const uploadBox = document.getElementById('img-container');
const fileInput = document.getElementById('file-input');
const browseButton = document.getElementById('browse-btn');
const preview = document.getElementById('preview');

console.log("Hi whassup");


function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}






// Images Input


// Trigger file input when "Browse" button is clicked
browseButton.addEventListener('click', () => {
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

            // Preview the image
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = 'Preview';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);

            



            const formData = new FormData();
            formData.append('image', file);

            
            // Simulate file upload (replace with actual server endpoint)
            fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                body: formData,
                // mode: 'no-cors'
            })
                // .then(response => response.json())
                .then((data, res) => {
                    console.log(`File "${file.name}" uploaded successfully!`, data);
                    if (!res.ok) {
                        throw new Error(`HTTP Error! Status: ${res.status}`);
                    }
                    const receivedData = res.json();
                    console.log("Data received: ", receivedData);
                })
                .catch(error => {
                    console.error(`Error uploading file "${file.name}":`, error);
                });
        } else {
            alert(`"${file.name}" is not a valid image file.`);
        }
        

        

    });
}




// Display Data and Image
async function displayData() {
    try {
        res = await axios.get("http://localhost:3000/api/tradeData");
        const tradeData = res.data;
        console.log("Trade data recieved: ", tradeData)
    } catch (error) {
        console.log("Error fetching data: ", error);
    }
}
