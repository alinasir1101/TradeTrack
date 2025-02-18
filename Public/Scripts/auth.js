document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    console.log('Login successful, storing token and redirecting...');
                    localStorage.setItem('token', data.token);
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

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
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