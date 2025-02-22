document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    console.log('Login successful');
                    window.location.href = '/';
                } else {
                    alert(data.error);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            const name = signupForm.name.value;
            const email = signupForm.email.value;
            const password = signupForm.password.value;
            const country = signupForm.country.value;
            const dateJoined = new Date();

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, country, dateJoined })
                });

                const data = await response.json();
                if (response.ok) {
                    alert('User registered successfully. Please login.');
                    window.location.href = '/login';
                } else {
                    alert(data.error);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    

    
});

function togglePassword() {
    const passwordInput = document.getElementById("password");
    const toggleButton = document.querySelector(".toggle-password");
    const eyeImg = document.querySelector('.eye-img');

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeImg.src = "../Assets/Unsee Password.png";
    } else {
        passwordInput.type = "password";
        eyeImg.src = "../Assets/See Password.png";
    }
}