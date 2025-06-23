const API_BASE_URL = window.location.origin;
let vetInfo = null;
let dashboardStats = null;

// Chart instances
let healthChart, breedChart, ageChart, weightChart;

// Initialize dashboard
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Load vet profile first
        await loadVetProfile();
        
        // Load dashboard data
        await Promise.all([
            loadDashboardStats(),
            loadRecentCows()
        ]);
        
        // Initialize charts
        initializeCharts();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showAlert('Failed to load dashboard data', 'error');
    }
});

async function loadVetProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/profile`);

        if (response.ok) {
            const data = await response.json();
            vetInfo = data.vet;
            updateVetInfo();
        } else {
            throw new Error('Failed to load profile');
        }
    } catch (error) {
        console.error('Profile loading error:', error);
        window.location.href = 'login.html';
    }
}

function updateVetInfo() {
    if (!vetInfo) return;

    document.getElementById('vetName').textContent = vetInfo.name;
    document.getElementById('vetRegion').textContent = `Region: ${vetInfo.region}`;
    document.getElementById('welcomeName').textContent = vetInfo.name;
    document.getElementById('welcomeRegion').textContent = vetInfo.region;
}

async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
        const data = await response.json();

        if (data.success) {
            dashboardStats = data.stats;
            updateStatsCards();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showAlert('Failed to load statistics', 'error');
    }
}

function updateStatsCards() {
    if (!dashboardStats) return;

    const statsGrid = document.getElementById('statsGrid');
    const { totalCows, healthStats, inspectionStats, vaccinationStats } = dashboardStats;

    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">🐄</div>
            <div class="stat-number">${totalCows}</div>
            <div class="stat-label">Total Cows</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-number">${healthStats.healthy}</div>
            <div class="stat-label">Healthy Cows</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🏥</div>
            <div class="stat-number">${healthStats.sick + healthStats.underTreatment}</div>
            <div class="stat-label">Need Attention</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-number">${inspectionStats.recent}</div>
            <div class="stat-label">Recent Inspections</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-number">${inspectionStats.overdue}</div>
            <div class="stat-label">Overdue Inspections</div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">💉</div>
            <div class="stat-number">${vaccinationStats.vaccinated}</div>
            <div class="stat-label">Vaccinated</div>
        </div>
    `;
}

function initializeCharts() {
    if (!dashboardStats) return;

    // Health Status Chart
    const healthCtx = document.getElementById('healthChart').getContext('2d');
    healthChart = new Chart(healthCtx, {
        type: 'doughnut',
        data: {
            labels: ['Healthy', 'Sick', 'Under Treatment'],
            datasets: [{
                data: [
                    dashboardStats.healthStats.healthy,
                    dashboardStats.healthStats.sick,
                    dashboardStats.healthStats.underTreatment
                ],
                backgroundColor: ['#4CAF50', '#f44336', '#ff9800'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Breed Distribution Chart
    const breedCtx = document.getElementById('breedChart').getContext('2d');
    breedChart = new Chart(breedCtx, {
        type: 'bar',
        data: {
            labels: dashboardStats.breedStats.map(b => b._id),
            datasets: [{
                label: 'Number of Cows',
                data: dashboardStats.breedStats.map(b => b.count),
                backgroundColor: '#667eea',
                borderColor: '#5a6fd8',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Age Distribution Chart
    const ageCtx = document.getElementById('ageChart').getContext('2d');
    ageChart = new Chart(ageCtx, {
        type: 'pie',
        data: {
            labels: dashboardStats.ageStats.map(a => a._id),
            datasets: [{
                data: dashboardStats.ageStats.map(a => a.count),
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Weight Chart
    const weightCtx = document.getElementById('weightChart').getContext('2d');
    weightChart = new Chart(weightCtx, {
        type: 'bar',
        data: {
            labels: dashboardStats.weightStats.map(w => w._id),
            datasets: [{
                label: 'Average Weight (kg)',
                data: dashboardStats.weightStats.map(w => Math.round(w.avgWeight)),
                backgroundColor: '#764ba2',
                borderColor: '#667eea',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Weight (kg)'
                    }
                }
            }
        }
    });
}

async function loadRecentCows() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/cows?limit=10`);
        const data = await response.json();

        if (data.success) {
            updateCowsTable(data.cows);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error loading cows:', error);
        document.getElementById('cowsTableBody').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: #666;">Failed to load cows data</td></tr>';
    }
}

function updateCowsTable(cows) {
    const tbody = document.getElementById('cowsTableBody');
    
    if (cows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No cows found</td></tr>';
        return;
    }

    tbody.innerHTML = cows.map(cow => `
        <tr>
            <td><strong>${cow.cowId}</strong></td>
            <td>${cow.name}</td>
            <td>${cow.breed}</td>
            <td>${cow.age} years</td>
            <td>${cow.weight} kg</td>
            <td><span class="health-status status-${cow.healthStatus}">${cow.healthStatus.replace('_', ' ')}</span></td>
            <td>${new Date(cow.lastInspection).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Handle cow search
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const cowId = document.getElementById('cowId').value.trim();
        if (cowId) {
            window.open(`/cow/${cowId}`, '_blank');
        }
    });
});

function logout() {
    fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' })
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch(() => {
            window.location.href = 'login.html';
        });
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${type}`;
    alertDiv.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
