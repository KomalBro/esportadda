// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCWXpfQuAB06Ebqms6_TpE_p31CtyfPv1c",
    authDomain: "esports-adda-1f4ca.firebaseapp.com",
    databaseURL: "https://esports-adda-1f4ca-default-rtdb.firebaseio.com",
    projectId: "esports-adda-1f4ca",
    storageBucket: "esports-adda-1f4ca.appspot.com",
    messagingSenderId: "1016111341367",
    appId: "1:1016111341367:web:165be8fd6210b0c49104b2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const gamesGrid = document.querySelector('.games-grid');
const tournamentsGrid = document.querySelector('.tournaments-grid');
const authModal = document.querySelector('#authModal');
const modalBody = authModal.querySelector('.modal-body');
const modalTitle = authModal.querySelector('.modal-title');

// Show Login Form
function showLoginForm() {
    modalTitle.textContent = 'Login';
    modalBody.innerHTML = `
        <form id="loginForm">
            <div class="mb-3">
                <input type="email" id="loginEmail" class="form-control" placeholder="Email" required>
            </div>
            <div class="mb-3">
                <input type="password" id="loginPassword" class="form-control" placeholder="Password" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">Login</button>
            <p class="text-center mt-3">
                Don't have an account? 
                <a href="#" onclick="showRegisterForm()">Register</a>
            </p>
        </form>
    `;

    // Add form submit event listener
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// Show Register Form
function showRegisterForm() {
    modalTitle.textContent = 'Register';
    modalBody.innerHTML = `
        <form id="registerForm">
            <div class="mb-3">
                <input type="text" id="registerUsername" class="form-control" placeholder="Username" required>
            </div>
            <div class="mb-3">
                <input type="email" id="registerEmail" class="form-control" placeholder="Email" required>
            </div>
            <div class="mb-3">
                <input type="password" id="registerPassword" class="form-control" placeholder="Password" required minlength="6">
            </div>
            <button type="submit" class="btn btn-primary w-100">Register</button>
            <p class="text-center mt-3">
                Already have an account? 
                <a href="#" onclick="showLoginForm()">Login</a>
            </p>
        </form>
    `;

    // Add form submit event listener
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

// Handle Login Form Submit
async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
        
        await auth.signInWithEmailAndPassword(email, password);
        const modal = bootstrap.Modal.getInstance(authModal);
        modal.hide();
    } catch (error) {
        alert(error.message);
    }
}

// Handle Register Form Submit
async function handleRegister(event) {
    event.preventDefault();
    
    try {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const username = document.getElementById('registerUsername').value;
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating account...';
        
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Create user profile in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: email === 'admin@battlemania.com' ? 'admin' : 'user', 
            gamesPlayed: 0,
            totalWinnings: 0
        });
        
        const modal = bootstrap.Modal.getInstance(authModal);
        modal.hide();
    } catch (error) {
        alert(error.message);
    }
}

// Authentication State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User is signed in:', user.email);
        updateUIForAuthenticatedUser(user);
    } else {
        console.log('User is signed out');
        updateUIForAnonymousUser();
    }
});

// UI Update Functions
function updateUIForAuthenticatedUser(user) {
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.textContent = 'My Account';
    loginBtn.removeAttribute('data-bs-toggle');
    loginBtn.removeAttribute('data-bs-target');
    
    // Add dropdown functionality
    loginBtn.setAttribute('data-bs-toggle', 'dropdown');
    
    // Create dropdown menu if it doesn't exist
    if (!loginBtn.nextElementSibling?.classList.contains('dropdown-menu')) {
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';
        dropdownMenu.innerHTML = `
            <a class="dropdown-item" href="#profile">Profile</a>
            <a class="dropdown-item" href="#wallet">Wallet</a>
            <a class="dropdown-item" href="#tournaments">My Tournaments</a>
            <div class="dropdown-divider"></div>
            <a class="dropdown-item" href="#" onclick="userSignOut()">Sign Out</a>
        `;
        loginBtn.parentNode.appendChild(dropdownMenu);
    }
}

function updateUIForAnonymousUser() {
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.textContent = 'Login';
    loginBtn.setAttribute('data-bs-toggle', 'modal');
    loginBtn.setAttribute('data-bs-target', '#authModal');
    
    // Remove dropdown if exists
    const dropdownMenu = loginBtn.parentNode.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.remove();
    }
}

// Sign Out Function
async function userSignOut() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Error during sign out:', error);
        alert(error.message);
    }
}

// Make current user admin
async function makeCurrentUserAdmin() {
    const user = auth.currentUser;
    if (user) {
        try {
            await db.collection('users').doc(user.uid).update({
                role: 'admin'
            });
            console.log('Successfully made user admin');
        } catch (error) {
            console.error('Error making user admin:', error);
        }
    }
}

// Call this function to make the current user admin
// makeCurrentUserAdmin();  // Uncomment this line temporarily to make current user admin

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Show login form when modal is opened
    authModal.addEventListener('show.bs.modal', () => {
        showLoginForm();
    });
});

// Make functions available globally
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.userSignOut = userSignOut;

// Game Data
const games = [
    {
        id: 'pubg',
        name: 'PUBG Mobile',
        image: 'assets/pubg.jpg',
        description: 'Battle Royale tournaments'
    },
    {
        id: 'freefire',
        name: 'Free Fire',
        image: 'assets/freefire.jpg',
        description: 'Action-packed matches'
    },
    {
        id: 'cod',
        name: 'Call of Duty Mobile',
        image: 'assets/cod.jpg',
        description: 'Competitive warfare'
    }
];

// Render Games
function renderGames() {
    gamesGrid.innerHTML = games.map(game => `
        <div class="game-card">
            <img src="${game.image}" alt="${game.name}" class="game-image">
            <div class="game-info">
                <h3>${game.name}</h3>
                <p>${game.description}</p>
                <button class="btn btn-primary" onclick="viewTournaments('${game.id}')">
                    View Tournaments
                </button>
            </div>
        </div>
    `).join('');
}

// Tournament Functions
function viewTournaments(gameId) {
    // Fetch and display tournaments for the selected game
    fetchTournaments(gameId).then(tournaments => {
        renderTournaments(tournaments);
    });
}

async function fetchTournaments(gameId) {
    // TODO: Implement API call to fetch tournaments
    return [];
}

function renderTournaments(tournaments) {
    tournamentsGrid.innerHTML = tournaments.map(tournament => `
        <div class="tournament-card">
            <h3>${tournament.name}</h3>
            <div class="tournament-details">
                <p>Prize Pool: ${tournament.prizePool}</p>
                <p>Players: ${tournament.currentPlayers}/${tournament.maxPlayers}</p>
                <p>Start Time: ${tournament.startTime}</p>
            </div>
            <button class="btn btn-primary" onclick="joinTournament('${tournament.id}')">
                Join Tournament
            </button>
        </div>
    `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderGames();
});
