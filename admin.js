// Firebase Configuration and Initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp, orderBy, limit, deleteDoc, addDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
let auth;
let db;

try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully in admin panel');
} catch (error) {
    console.error('Firebase initialization error:', error);
    alert('Error initializing Firebase. Please try again later.');
}

// Admin Configuration
const ADMIN_EMAIL = 'admin@esportadda.com';

// Navigation Functions
function setupEventListeners() {
    // Setup navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = e.currentTarget.getAttribute('href');
            if (!href) return;

            // Remove # from href to get section name
            const sectionName = href.replace('#', '');
            const sectionId = sectionName + '-section';
            
            // Update URL hash without triggering scroll
            window.history.pushState(null, '', href);
            
            showSection(sectionId);
            
            // Update active state
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Setup sign out
    document.getElementById('signOut')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out?')) {
            signOut(auth).then(() => {
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error('Sign out error:', error);
                alert('Error signing out. Please try again.');
            });
        }
    });

    // Setup sidebar toggle for mobile
    document.getElementById('toggleSidebar')?.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('show');
    });
}

function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.remove('d-none');
        selectedSection.classList.add('active');
        
        // Load section data
        switch(sectionId) {
            case 'dashboard-section':
                loadDashboardStats();
                loadRecentMatches();
                loadRecentTransactions();
                break;
            case 'games-section':
                loadGames();
                break;
            case 'tournaments-section':
                loadTournaments();
                break;
            case 'users-section':
                loadUsers();
                break;
            case 'transactions-section':
                loadTransactions();
                break;
            case 'withdrawals-section':
                loadWithdrawals();
                break;
            case 'support-section':
                loadSupportTickets();
                break;
            case 'activity-section':
                loadActivityLogs();
                break;
            case 'settings-section':
                loadSettings();
                break;
        }
    } else {
        console.error(`Section ${sectionId} not found`);
    }
}

// Handle URL hash changes and initial load
function handleHashChange() {
    const hash = window.location.hash || '#dashboard';
    const sectionId = hash.replace('#', '') + '-section';
    const navLink = document.querySelector(`.nav-link[href="${hash}"]`);
    
    if (navLink) {
        // Update active state
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        navLink.classList.add('active');
        
        // Show section
        showSection(sectionId);
    }
}

// Initialize when authenticated
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (!user || user.email !== ADMIN_EMAIL) {
            // Redirect to login if not authenticated or not admin
            window.location.href = 'login.html';
            return;
        }
        
        console.log('Admin authenticated:', user.email);
        
        // Update UI with admin email
        document.querySelector('.admin-email').textContent = user.email;
        
        // Setup event listeners and handle initial navigation
        setupEventListeners();
        handleHashChange();
        
        // Handle navigation changes
        window.addEventListener('hashchange', handleHashChange);
    });
});

// Make functions globally available
window.signOut = () => signOut(auth);

// Dashboard Functions
async function loadDashboardStats() {
    try {
        // Load total users
        const usersSnapshot = await getDocs(query(collection(db, 'users')));
        document.getElementById('total-users').textContent = usersSnapshot.size;

        // Load today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const transactionsSnapshot = await getDocs(query(collection(db, 'transactions'), where('timestamp', '>=', today)));
        let todayRevenue = 0;
        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            if (transaction.type === 'credit') {
                todayRevenue += transaction.amount;
            }
        });
        document.getElementById('today-revenue').textContent = '₹' + todayRevenue;

        // Load active matches
        const matchesSnapshot = await getDocs(query(collection(db, 'matches'), where('status', '==', 'active')));
        document.getElementById('active-matches').textContent = matchesSnapshot.size;

        // Load pending withdrawals
        const withdrawalsSnapshot = await getDocs(query(collection(db, 'withdrawals'), where('status', '==', 'pending')));
        document.getElementById('pending-withdrawals').textContent = withdrawalsSnapshot.size;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Recent Matches
async function loadRecentMatches() {
    try {
        const matchesSnapshot = await getDocs(query(collection(db, 'matches'), orderBy('timestamp', 'desc'), limit(5)));

        const tableBody = document.getElementById('recent-matches');
        tableBody.innerHTML = '';

        matchesSnapshot.forEach(doc => {
            const match = doc.data();
            const row = `
                <tr>
                    <td>${doc.id}</td>
                    <td>${match.game}</td>
                    <td>${new Date(match.timestamp).toLocaleDateString()}</td>
                    <td>₹${match.prizePool}</td>
                    <td>
                        <span class="badge bg-${match.status === 'completed' ? 'success' : 'warning'}">
                            ${match.status}
                        </span>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading recent matches:', error);
    }
}

// Load Recent Transactions
async function loadRecentTransactions() {
    try {
        const transactionsRef = collection(db, 'transactions');
        const q = query(transactionsRef, 
            orderBy('timestamp', 'desc'),
            limit(5)
        );
        
        const transactionsSnapshot = await getDocs(q);
        const transactionsDiv = document.getElementById('recent-transactions');
        
        if (!transactionsDiv) {
            console.error('Recent transactions container not found');
            return;
        }

        transactionsDiv.innerHTML = '';

        if (transactionsSnapshot.empty) {
            transactionsDiv.innerHTML = '<p class="text-center text-muted">No recent transactions</p>';
            return;
        }

        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            const transactionElement = document.createElement('div');
            transactionElement.className = 'transaction-item p-2 border-bottom';
            
            const amountClass = transaction.type === 'credit' ? 'text-success' : 'text-danger';
            const amountPrefix = transaction.type === 'credit' ? '+' : '-';
            
            transactionElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${transaction.userId}</div>
                        <small class="text-muted">${formatTimestamp(transaction.timestamp)}</small>
                    </div>
                    <div class="${amountClass} fw-bold">
                        ${amountPrefix}₹${transaction.amount}
                    </div>
                </div>
                <div class="small text-muted">${transaction.description || 'No description'}</div>
            `;
            
            transactionsDiv.appendChild(transactionElement);
        });
    } catch (error) {
        console.error('Error loading recent transactions:', error);
        const transactionsDiv = document.getElementById('recent-transactions');
        if (transactionsDiv) {
            transactionsDiv.innerHTML = '<p class="text-center text-danger">Error loading transactions</p>';
        }
    }
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        const date = timestamp.toDate();
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} mins ago`;
        if (diffMinutes < 1440) {
            const hours = Math.floor(diffMinutes / 60);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }
        
        const days = Math.floor(diffMinutes / 1440);
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'Invalid date';
    }
}

// Match Management
async function createMatch(event) {
    event.preventDefault();
    const game = document.getElementById('match-game').value;
    const type = document.getElementById('match-type').value;
    const fee = parseFloat(document.getElementById('match-fee').value);
    const prize = parseFloat(document.getElementById('match-prize').value);
    const map = document.getElementById('match-map').value;
    const time = new Date(document.getElementById('match-time').value).getTime();

    try {
        await setDoc(doc(db, 'matches', v4()), {
            game,
            type,
            entryFee: fee,
            prizePool: prize,
            map,
            timestamp: time,
            status: 'upcoming',
            players: [],
            createdAt: serverTimestamp()
        });

        $('#addMatchModal').modal('hide');
        loadMatches();
        alert('Match created successfully!');
    } catch (error) {
        console.error('Error creating match:', error);
        alert('Error creating match: ' + error.message);
    }
}

// Wallet Management
async function addBalance(event) {
    event.preventDefault();
    
    const userId = document.getElementById('wallet-user-id').value;
    const amount = parseFloat(document.getElementById('wallet-amount').value);
    const note = document.getElementById('wallet-note').value;

    try {
        await setDoc(doc(db, 'transactions', v4()), {
            userId,
            amount,
            type: 'credit',
            note,
            timestamp: serverTimestamp()
        });

        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            balance: increment(amount)
        });

        document.getElementById('add-balance-form').reset();
        loadWalletTransactions();
        alert('Balance added successfully!');
    } catch (error) {
        console.error('Error adding balance:', error);
        alert('Error adding balance: ' + error.message);
    }
}

// Support Tickets
async function loadSupportTickets() {
    try {
        const ticketsSnapshot = await getDocs(query(collection(db, 'support_tickets'), where('status', '==', 'open'), orderBy('timestamp', 'desc')));

        const tableBody = document.getElementById('open-tickets-list');
        tableBody.innerHTML = '';

        ticketsSnapshot.forEach(doc => {
            const ticket = doc.data();
            const row = `
                <tr>
                    <td>${doc.id}</td>
                    <td>${ticket.userId}</td>
                    <td>${ticket.subject}</td>
                    <td>
                        <span class="badge bg-warning">Open</span>
                    </td>
                    <td>${new Date(ticket.timestamp).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewTicket('${doc.id}')">
                            View
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading support tickets:', error);
    }
}

// Utility Functions
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('d-none');
    });
    document.getElementById(sectionId).classList.remove('d-none');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

function signOut() {
    if (confirm('Are you sure you want to sign out?')) {
        auth.signOut();
    }
}

// Make functions globally available
window.createMatch = createMatch;
window.addBalance = addBalance;
window.signOut = signOut;
window.toggleSidebar = toggleSidebar;
window.showSection = showSection;

// Users Management
async function loadUsers() {
    try {
        const usersSnapshot = await getDocs(query(collection(db, 'users')));
        const tableBody = document.getElementById('users-table-body');
        tableBody.innerHTML = '';

        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const row = `
                <tr>
                    <td>${doc.id}</td>
                    <td>${user.username || 'N/A'}</td>
                    <td>${user.email}</td>
                    <td>₹${user.balance || 0}</td>
                    <td>
                        <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">
                            ${user.status || 'inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editUser('${doc.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteUser('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users. Please try again.');
    }
}

async function addUser() {
    const username = document.getElementById('new-username').value;
    const email = document.getElementById('new-user-email').value;
    const password = document.getElementById('new-user-password').value;

    try {
        // Create auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Add user to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            username,
            email,
            balance: 0,
            status: 'active',
            createdAt: serverTimestamp()
        });

        $('#addUserModal').modal('hide');
        loadUsers();
        alert('User added successfully!');
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user: ' + error.message);
    }
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await deleteDoc(doc(db, 'users', userId));
            loadUsers();
            alert('User deleted successfully!');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user. Please try again.');
        }
    }
}

// Games Management
async function loadGames() {
    try {
        const gamesRef = collection(db, 'games');
        const gamesSnapshot = await getDocs(gamesRef);
        const gamesTableBody = document.getElementById('gamesTableBody');
        
        if (!gamesTableBody) {
            console.error('Games table body not found');
            return;
        }

        gamesTableBody.innerHTML = '';

        if (gamesSnapshot.empty) {
            gamesTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No games found</td></tr>';
            return;
        }

        gamesSnapshot.forEach(doc => {
            const game = { id: doc.id, ...doc.data() };
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${game.name}</td>
                <td><img src="${game.imageUrl}" alt="${game.name}" height="40"></td>
                <td>
                    <span class="badge bg-${game.status === 'active' ? 'success' : 'secondary'}">
                        ${game.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary me-2" onclick="editGame('${game.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGame('${game.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            gamesTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading games:', error);
        alert('Error loading games. Please try again.');
    }
}

async function addGame(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const gameData = {
            name: formData.get('gameName'),
            imageUrl: formData.get('gameImage'),
            status: formData.get('gameStatus'),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'games'), gameData);
        
        // Close modal and reload games
        const modal = bootstrap.Modal.getInstance(document.getElementById('addGameModal'));
        modal.hide();
        form.reset();
        loadGames();
        
        alert('Game added successfully!');
    } catch (error) {
        console.error('Error adding game:', error);
        alert('Error adding game. Please try again.');
    }
}

async function editGame(gameId) {
    try {
        const gameDoc = await getDoc(doc(db, 'games', gameId));
        if (!gameDoc.exists()) {
            alert('Game not found');
            return;
        }

        const game = gameDoc.data();
        const form = document.getElementById('editGameForm');
        form.elements.gameName.value = game.name;
        form.elements.gameImage.value = game.imageUrl;
        form.elements.gameStatus.value = game.status;
        form.dataset.gameId = gameId;

        const modal = new bootstrap.Modal(document.getElementById('editGameModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading game for edit:', error);
        alert('Error loading game. Please try again.');
    }
}

async function deleteGame(gameId) {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
        await deleteDoc(doc(db, 'games', gameId));
        loadGames();
        alert('Game deleted successfully!');
    } catch (error) {
        console.error('Error deleting game:', error);
        alert('Error deleting game. Please try again.');
    }
}

// Tournaments Management
async function loadTournaments() {
    try {
        const tournamentsRef = collection(db, 'tournaments');
        const gamesRef = collection(db, 'games');
        
        // Load games for filter and reference
        const gamesSnapshot = await getDocs(gamesRef);
        const games = {};
        const gameFilter = document.getElementById('tournamentGameFilter');
        
        if (gameFilter) {
            gameFilter.innerHTML = '<option value="">All Games</option>';
            gamesSnapshot.forEach(doc => {
                const game = doc.data();
                games[doc.id] = game.name;
                gameFilter.innerHTML += `<option value="${doc.id}">${game.name}</option>`;
            });
        }

        // Update games dropdown in add tournament form
        const gameSelect = document.querySelector('#addTournamentForm select[name="gameId"]');
        if (gameSelect) {
            gameSelect.innerHTML = '<option value="">Select a game</option>';
            Object.entries(games).forEach(([id, name]) => {
                gameSelect.innerHTML += `<option value="${id}">${name}</option>`;
            });
        }

        // Load tournaments
        const tournamentsSnapshot = await getDocs(tournamentsRef);
        
        // Clear existing data
        document.getElementById('upcomingTournamentsBody').innerHTML = '';
        document.getElementById('ongoingTournamentsBody').innerHTML = '';
        document.getElementById('completedTournamentsBody').innerHTML = '';
        
        // Reset counters
        let upcomingCount = 0;
        let ongoingCount = 0;
        let completedCount = 0;

        tournamentsSnapshot.forEach(doc => {
            const tournament = { id: doc.id, ...doc.data() };
            const row = createTournamentRow(tournament, games);
            
            // Add to appropriate tab
            switch(tournament.status) {
                case 'upcoming':
                case 'registration':
                    document.getElementById('upcomingTournamentsBody').appendChild(row);
                    upcomingCount++;
                    break;
                case 'ongoing':
                    document.getElementById('ongoingTournamentsBody').appendChild(row);
                    ongoingCount++;
                    break;
                case 'completed':
                    document.getElementById('completedTournamentsBody').appendChild(row);
                    completedCount++;
                    break;
            }
        });

        // Update badges
        document.querySelector('[data-bs-target="#upcomingTournaments"] .badge').textContent = upcomingCount;
        document.querySelector('[data-bs-target="#ongoingTournaments"] .badge').textContent = ongoingCount;
        document.querySelector('[data-bs-target="#completedTournaments"] .badge').textContent = completedCount;

    } catch (error) {
        console.error('Error loading tournaments:', error);
        alert('Error loading tournaments. Please try again.');
    }
}

function createTournamentRow(tournament, games) {
    const row = document.createElement('tr');
    
    const startDate = tournament.startDate?.toDate() || new Date();
    const statusClass = {
        'upcoming': 'info',
        'registration': 'primary',
        'ongoing': 'success',
        'completed': 'secondary'
    }[tournament.status] || 'secondary';

    row.innerHTML = `
        <td>${tournament.id.slice(0, 8)}...</td>
        <td>${tournament.name}</td>
        <td>${games[tournament.gameId] || 'Unknown Game'}</td>
        <td>${startDate.toLocaleString()}</td>
        <td>₹${tournament.entryFee}</td>
        <td>₹${tournament.prizePool}</td>
        <td>${tournament.currentPlayers || 0}/${tournament.maxPlayers}</td>
        <td>
            <span class="badge bg-${statusClass}">
                ${tournament.status}
            </span>
        </td>
        <td>
            <div class="btn-group">
                <button class="btn btn-sm btn-info me-1" onclick="viewTournamentDetails('${tournament.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary me-1" onclick="editTournament('${tournament.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTournament('${tournament.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    return row;
}

async function viewTournamentDetails(tournamentId) {
    try {
        const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
        if (!tournamentDoc.exists()) {
            alert('Tournament not found');
            return;
        }

        const tournament = tournamentDoc.data();
        const gameDoc = await getDoc(doc(db, 'games', tournament.gameId));
        const game = gameDoc.exists() ? gameDoc.data() : { name: 'Unknown Game' };

        // Update details modal
        document.getElementById('detailTournamentId').textContent = tournamentId;
        document.getElementById('detailName').textContent = tournament.name;
        document.getElementById('detailGame').textContent = game.name;
        document.getElementById('detailStatus').innerHTML = `
            <span class="badge bg-${getStatusClass(tournament.status)}">
                ${tournament.status}
            </span>
        `;
        document.getElementById('detailStartDate').textContent = tournament.startDate.toDate().toLocaleString();
        document.getElementById('detailRegEnd').textContent = tournament.registrationEndDate.toDate().toLocaleString();
        document.getElementById('detailPlayers').textContent = `${tournament.currentPlayers || 0}/${tournament.maxPlayers}`;
        document.getElementById('detailMap').textContent = tournament.map;

        // Show prize distribution
        const prizeTable = document.getElementById('detailPrizes');
        if (tournament.prizes && tournament.prizes.length > 0) {
            let prizeHtml = '<table class="table table-sm">';
            tournament.prizes.forEach((prize, index) => {
                if (prize > 0) {
                    prizeHtml += `
                        <tr>
                            <th>${index + 1}${getOrdinalSuffix(index + 1)} Place</th>
                            <td>₹${prize}</td>
                        </tr>
                    `;
                }
            });
            prizeHtml += '</table>';
            prizeTable.innerHTML = prizeHtml;
        } else {
            prizeTable.innerHTML = '<p class="text-muted">No prize distribution set</p>';
        }

        // Show rules
        document.getElementById('detailRules').innerHTML = tournament.rules || 'No rules specified';

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('tournamentDetailsModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading tournament details:', error);
        alert('Error loading tournament details. Please try again.');
    }
}

function getStatusClass(status) {
    return {
        'upcoming': 'info',
        'registration': 'primary',
        'ongoing': 'success',
        'completed': 'secondary'
    }[status] || 'secondary';
}

function getOrdinalSuffix(i) {
    const j = i % 10,
          k = i % 100;
    if (j == 1 && k != 11) {
        return "st";
    }
    if (j == 2 && k != 12) {
        return "nd";
    }
    if (j == 3 && k != 13) {
        return "rd";
    }
    return "th";
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Tournament filters
    document.getElementById('tournamentGameFilter')?.addEventListener('change', loadTournaments);
    document.getElementById('tournamentStatusFilter')?.addEventListener('change', loadTournaments);
    document.getElementById('tournamentSearch')?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('tbody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    document.getElementById('refreshTournaments')?.addEventListener('click', loadTournaments);

    // Tournament form handlers
    document.getElementById('addTournamentForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        try {
            const prizes = Array.from(formData.getAll('prizes[]')).map(Number);
            const tournamentData = {
                name: formData.get('tournamentName'),
                gameId: formData.get('gameId'),
                startDate: new Date(formData.get('startDate')),
                registrationEndDate: new Date(formData.get('registrationEndDate')),
                entryFee: Number(formData.get('entryFee')),
                prizePool: Number(formData.get('prizePool')),
                maxPlayers: Number(formData.get('maxPlayers')),
                status: formData.get('status'),
                map: formData.get('map'),
                rules: formData.get('rules'),
                prizes: prizes,
                currentPlayers: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'tournaments'), tournamentData);
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTournamentModal'));
            modal.hide();
            form.reset();
            loadTournaments();
            
            alert('Tournament created successfully!');
        } catch (error) {
            console.error('Error creating tournament:', error);
            alert('Error creating tournament. Please try again.');
        }
    });
});

// Make functions available globally
window.viewTournamentDetails = viewTournamentDetails;
window.editTournament = editTournament;
window.deleteTournament = deleteTournament;

// Dashboard Functions
async function loadDashboardStats() {
    try {
        // Get total users count
        const usersSnapshot = await getDocs(collection(db, 'users'));
        document.getElementById('totalUsers').textContent = usersSnapshot.size;

        // Get total tournaments count
        const tournamentsSnapshot = await getDocs(collection(db, 'tournaments'));
        document.getElementById('totalTournaments').textContent = tournamentsSnapshot.size;

        // Get total games count
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        document.getElementById('totalGames').textContent = gamesSnapshot.size;

        console.log('Dashboard stats loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentMatches() {
    try {
        const matchesQuery = query(
            collection(db, 'matches'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const matchesSnapshot = await getDocs(matchesQuery);
        const matchesList = document.getElementById('recentMatchesList');
        matchesList.innerHTML = '';

        matchesSnapshot.forEach(doc => {
            const match = doc.data();
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${match.tournamentName}</h6>
                        <small class="text-muted">${match.gameName}</small>
                    </div>
                    <span class="badge bg-primary">${match.status}</span>
                </div>
            `;
            matchesList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading recent matches:', error);
    }
}

// Games Functions
async function loadGames() {
    try {
        const gamesSnapshot = await getDocs(collection(db, 'games'));
        const gamesList = document.getElementById('gamesList');
        if (!gamesList) {
            console.error('Games list element not found');
            return;
        }
        
        gamesList.innerHTML = '';
        
        gamesSnapshot.forEach(doc => {
            const game = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <img src="${game.imageUrl || 'placeholder.png'}" alt="${game.name}" class="game-icon">
                    ${game.name}
                </td>
                <td>${game.category}</td>
                <td>${game.status}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-2" onclick="editGame('${doc.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteGame('${doc.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            gamesList.appendChild(tr);
        });
        
        console.log('Games loaded successfully');
    } catch (error) {
        console.error('Error loading games:', error);
    }
}

// Tournaments Functions
async function loadTournaments() {
    try {
        const tournamentsQuery = query(
            collection(db, 'tournaments'),
            orderBy('startDate', 'desc')
        );
        const tournamentsSnapshot = await getDocs(tournamentsQuery);
        const tournamentsList = document.getElementById('tournamentsList');
        if (!tournamentsList) {
            console.error('Tournaments list element not found');
            return;
        }
        
        tournamentsList.innerHTML = '';
        
        tournamentsSnapshot.forEach(doc => {
            const tournament = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tournament.name}</td>
                <td>${tournament.game}</td>
                <td>${tournament.startDate}</td>
                <td>${tournament.entryFee}</td>
                <td>${tournament.prizePool}</td>
                <td>
                    <span class="badge bg-${getStatusBadgeClass(tournament.status)}">
                        ${tournament.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary me-2" onclick="editTournament('${doc.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTournament('${doc.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tournamentsList.appendChild(tr);
        });
        
        console.log('Tournaments loaded successfully');
    } catch (error) {
        console.error('Error loading tournaments:', error);
    }
}

// Users Functions
async function loadUsers() {
    try {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const usersSnapshot = await getDocs(usersQuery);
        const usersList = document.getElementById('usersList');
        if (!usersList) {
            console.error('Users list element not found');
            return;
        }
        
        usersList.innerHTML = '';
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role || 'user'}</td>
                <td>${user.status || 'active'}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-2" onclick="viewUser('${doc.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="blockUser('${doc.id}')">
                        <i class="fas fa-ban"></i>
                    </button>
                </td>
            `;
            usersList.appendChild(tr);
        });
        
        console.log('Users loaded successfully');
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Transactions Functions
async function loadTransactions() {
    try {
        const transactionsQuery = query(
            collection(db, 'transactions'),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsList = document.getElementById('transactionsList');
        if (!transactionsList) {
            console.error('Transactions list element not found');
            return;
        }
        
        transactionsList.innerHTML = '';
        
        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${transaction.id}</td>
                <td>${transaction.userId}</td>
                <td>${transaction.type}</td>
                <td>${transaction.amount}</td>
                <td>${transaction.status}</td>
                <td>${new Date(transaction.timestamp?.toDate()).toLocaleString()}</td>
            `;
            transactionsList.appendChild(tr);
        });
        
        console.log('Transactions loaded successfully');
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Withdrawals Functions
async function loadWithdrawals() {
    try {
        const withdrawalsQuery = query(
            collection(db, 'withdrawals'),
            orderBy('timestamp', 'desc')
        );
        const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
        const withdrawalsList = document.getElementById('withdrawalsList');
        if (!withdrawalsList) {
            console.error('Withdrawals list element not found');
            return;
        }
        
        withdrawalsList.innerHTML = '';
        
        withdrawalsSnapshot.forEach(doc => {
            const withdrawal = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${withdrawal.userId}</td>
                <td>${withdrawal.amount}</td>
                <td>${withdrawal.method}</td>
                <td>${withdrawal.status}</td>
                <td>${new Date(withdrawal.timestamp?.toDate()).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-success me-2" onclick="approveWithdrawal('${doc.id}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectWithdrawal('${doc.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            withdrawalsList.appendChild(tr);
        });
        
        console.log('Withdrawals loaded successfully');
    } catch (error) {
        console.error('Error loading withdrawals:', error);
    }
}

// Support Functions
async function loadSupportTickets() {
    try {
        const ticketsQuery = query(
            collection(db, 'support_tickets'),
            orderBy('timestamp', 'desc')
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);
        const ticketsList = document.getElementById('supportTicketsList');
        if (!ticketsList) {
            console.error('Support tickets list element not found');
            return;
        }
        
        ticketsList.innerHTML = '';
        
        ticketsSnapshot.forEach(doc => {
            const ticket = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ticket.id}</td>
                <td>${ticket.userId}</td>
                <td>${ticket.subject}</td>
                <td>${ticket.status}</td>
                <td>${new Date(ticket.timestamp?.toDate()).toLocaleString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewTicket('${doc.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            ticketsList.appendChild(tr);
        });
        
        console.log('Support tickets loaded successfully');
    } catch (error) {
        console.error('Error loading support tickets:', error);
    }
}

// Activity Logs Functions
async function loadActivityLogs() {
    try {
        const logsQuery = query(
            collection(db, 'activity_logs'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
        const logsSnapshot = await getDocs(logsQuery);
        const logsList = document.getElementById('activityLogsList');
        if (!logsList) {
            console.error('Activity logs list element not found');
            return;
        }
        
        logsList.innerHTML = '';
        
        logsSnapshot.forEach(doc => {
            const log = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(log.timestamp?.toDate()).toLocaleString()}</td>
                <td>${log.userId}</td>
                <td>${log.action}</td>
                <td>${log.details}</td>
            `;
            logsList.appendChild(tr);
        });
        
        console.log('Activity logs loaded successfully');
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

// Settings Functions
async function loadSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
            const settings = settingsDoc.data();
            // Update settings form fields
            Object.keys(settings).forEach(key => {
                const input = document.getElementById(`setting_${key}`);
                if (input) {
                    input.value = settings[key];
                }
            });
        }
        console.log('Settings loaded successfully');
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Utility Functions
function getStatusBadgeClass(status) {
    switch(status?.toLowerCase()) {
        case 'active':
        case 'approved':
            return 'success';
        case 'pending':
            return 'warning';
        case 'cancelled':
        case 'rejected':
            return 'danger';
        default:
            return 'secondary';
    }
}

// Make functions globally available
window.loadGames = loadGames;
window.loadTournaments = loadTournaments;
window.loadUsers = loadUsers;
window.loadTransactions = loadTransactions;
window.loadWithdrawals = loadWithdrawals;
window.loadSupportTickets = loadSupportTickets;
window.loadActivityLogs = loadActivityLogs;
window.loadSettings = loadSettings;
