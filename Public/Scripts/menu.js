const backToMainBtn = document.getElementById('backtomain');
const logOut = document.getElementById('logout');
const nameOfUser = document.getElementById('nameOfUser');
let userData;

backToMainBtn.onclick = function () {
    window.location.href = '/';
}

const fetchUserData = async () => {
    try {
      const response = await fetch("/api/getUserInfo", {
        method: "GET",
        credentials: "include", // Allows sending cookies
      });
      userData = await response.json(); // Assign to variable
      console.log(userData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
};



async function main () {
    await fetchUserData();
    nameOfUser.textContent = `${userData.name}`;
}

main();


logOut.onclick = function () {

    fetch("/api/logout", { method: "POST", credentials: "include" })
    .then(response => response.json())
    .then(data => console.log(data.message))
    .catch(err => console.err(err));


    window.location.href = '/login';
}