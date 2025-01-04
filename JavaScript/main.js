const uploadBox = document.getElementById('img-container');
const fileInput = document.getElementById('file-input');
const browseButton = document.getElementById('browse-btn');
const preview = document.getElementById('preview');


// axios.post("http://127.0.0.1:3000/", data)
// .then(response => {
//     console.log('Response:', response.data);
//     alert('POST request successful!');
// })
// .catch(error => {
//     console.error('Error:', error);
//     alert('POST request failed.');
// });
// const data = {name:"Ali", age:22};

// browseButton.addEventListener('click', ()=> {
//     axios.post("http://127.0.0.1:3000/api", data)
//     .then(response => {
//      console.log('Response:', response.data);
//      alert('POST request successful!');
//     })
//     .catch(error => {
//      console.error('Error:', error);
//      alert('POST request failed.');
//     });
// })

console.log("Hi whassup");



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

            // Simulate file upload (replace with actual server endpoint)
            const formData = new FormData();
            formData.append('image', file);

            fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData,
                // mode: 'no-cors'
            })
                // .then(response => response.json())
                .then(data => {
                    console.log(`File "${file.name}" uploaded successfully!`, data);
                })
                .catch(error => {
                    console.error(`Error uploading file "${file.name}":`, error);
                });
        } else {
            alert(`"${file.name}" is not a valid image file.`);
        }
    });
}
