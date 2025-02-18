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

                // const data = await response.json();
                if (response.ok) {
                    console.log('Login successful');
                    // window.location.href = '/';
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


    // Add Event Listener to all protected links to attach token
    document.querySelectorAll('.protected-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            if (token) {
                fetch(link.href, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(response => response.text())
                .then(data => {
                    document.open();
                    document.write(data);
                    document.close();
                })
                .catch(error => {
                    console.error('Error:', error);
                    window.location.href = '/login';
                });
            } else {
                window.location.href = '/login';
            }
        });
    });
});