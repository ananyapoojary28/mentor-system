// Global variables
let currentUser = null;
let database = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDatabase();
    setupEventListeners();
    checkLoggedInUser();
});

// Initialize SQLite database
function initializeDatabase() {
    // For this demo, we'll use localStorage as a simple database
    // In production, you'd want to use a proper database like SQLite, MySQL, or PostgreSQL
    database = {
        users: JSON.parse(localStorage.getItem('users') || '[]'),
        mentorAssignments: JSON.parse(localStorage.getItem('mentorAssignments') || '[]'),
        mentorForms: JSON.parse(localStorage.getItem('mentorForms') || '[]'),
        deadlines: JSON.parse(localStorage.getItem('deadlines') || '[]')
    };
    
    // Create default admin if no users exist
    if (database.users.length === 0) {
        createDefaultAdmin();
    }
}

// Create default admin user
function createDefaultAdmin() {
    const defaultAdmin = {
        id: generateId(),
        name: 'System Administrator',
        email: 'admin@mentor.com',
        password: 'admin123',
        role: 'admin',
        createdAt: new Date().toISOString()
    };
    
    database.users.push(defaultAdmin);
    saveDatabase();
    showToast('Default admin created (admin@mentor.com / admin123)', 'info');
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Role change listeners for dynamic fields
    document.getElementById('registerRole').addEventListener('change', toggleRoleFields);
}

// Toggle role-specific fields
function toggleRoleFields() {
    const role = document.getElementById('registerRole').value;
    const mentorFields = document.getElementById('mentorFields');
    const studentFields = document.getElementById('studentFields');
    
    mentorFields.style.display = role === 'mentor' ? 'block' : 'none';
    studentFields.style.display = role === 'student' ? 'block' : 'none';
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Save database to localStorage
function saveDatabase() {
    localStorage.setItem('users', JSON.stringify(database.users));
    localStorage.setItem('mentorAssignments', JSON.stringify(database.mentorAssignments));
    localStorage.setItem('mentorForms', JSON.stringify(database.mentorForms));
    localStorage.setItem('deadlines', JSON.stringify(database.deadlines));
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;
    
    const user = database.users.find(u => 
        u.email === email && 
        u.password === password && 
        u.role === role
    );
    
    if (user) {
        // Refresh user data from database to get latest updates
        currentUser = database.users.find(u => u.id === user.id);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
        showToast(`Welcome back, ${currentUser.name}!`, 'success');
    } else {
        showToast('Invalid credentials. Please try again.', 'danger');
    }
}

// Handle registration
function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('registerRole').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'danger');
        return;
    }
    
    // Check if user already exists
    if (database.users.find(u => u.email === email)) {
        showToast('User with this email already exists!', 'danger');
        return;
    }
    
    // Create new user
    const newUser = {
        id: generateId(),
        name,
        email,
        password,
        role,
        createdAt: new Date().toISOString()
    };
    
    // Add role-specific data
    if (role === 'mentor') {
        newUser.department = document.getElementById('mentorDepartment').value;
        newUser.employeeId = document.getElementById('mentorEmployeeId').value;
    } else if (role === 'student') {
        newUser.studentId = document.getElementById('studentId').value;
        newUser.semester = document.getElementById('studentSemester').value;
        newUser.department = document.getElementById('studentDepartment').value;
        newUser.mentorId = null; // Will be assigned by admin
    }
    
    database.users.push(newUser);
    saveDatabase();
    
    showToast('Registration successful! Please login.', 'success');
    showLogin();
    
    // Reset form
    document.getElementById('registerForm').reset();
}

// Check if user is already logged in
function checkLoggedInUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        // Refresh user data from database to get latest updates
        currentUser = database.users.find(u => u.id === userData.id && u.email === userData.email);
        if (currentUser) {
            showDashboard();
        } else {
            // User not found in database, clear localStorage
            localStorage.removeItem('currentUser');
            showLogin();
        }
    }
}

// Show login section
function showLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'none';
}

// Show register section
function showRegister() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
    document.getElementById('dashboardSection').style.display = 'none';
}

// Show dashboard based on user role
function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    
    // Refresh current user data from database to get latest updates
    if (currentUser) {
        currentUser = database.users.find(u => u.id === currentUser.id);
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    // Update navigation
    updateUserNavigation();
    
    // Load role-specific dashboard
    switch (currentUser.role) {
        case 'admin':
            loadAdminDashboard();
            break;
        case 'mentor':
            loadMentorDashboard();
            break;
        case 'student':
            loadStudentDashboard();
            break;
    }
}

// Update user navigation
function updateUserNavigation() {
    const userNav = document.getElementById('userNav');
    userNav.innerHTML = `
        <span class="navbar-text me-3">
            <i class="fas fa-user-circle me-1"></i> ${currentUser.name} (${currentUser.role})
        </span>
        <button class="btn btn-outline-light btn-sm" onclick="logout()">
            <i class="fas fa-sign-out-alt me-1"></i> Logout
        </button>
    `;
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLogin();
    showToast('Logged out successfully', 'info');
}

// Set minimum date for deadline input
function setMinDeadlineDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minDateTime = now.toISOString().slice(0, 16);
    
    const deadlineInput = document.getElementById('deadlineDate');
    if (deadlineInput) {
        deadlineInput.min = minDateTime;
    }
}

// Load admin dashboard
function loadAdminDashboard() {
    const dashboardContent = document.getElementById('dashboardContent');
    const stats = getAdminStats();
    
    dashboardContent.innerHTML = `
        <div class="dashboard-header text-center">
            <h1><i class="fas fa-user-shield me-2"></i>Admin Dashboard</h1>
            <p class="lead">Manage mentors, students, and system settings</p>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3 mb-3">
                <div class="stats-card primary">
                    <div class="card-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>${stats.totalUsers}</h3>
                    <p class="text-muted">Total Users</p>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="stats-card success">
                    <div class="card-icon">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                    <h3>${stats.totalMentors}</h3>
                    <p class="text-muted">Mentors</p>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="stats-card warning">
                    <div class="card-icon">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <h3>${stats.totalStudents}</h3>
                    <p class="text-muted">Students</p>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="stats-card info">
                    <div class="card-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <h3>${stats.totalForms}</h3>
                    <p class="text-muted">Forms Submitted</p>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-user-plus me-2"></i>Assign Mentor to Student</h5>
                    </div>
                    <div class="card-body">
                        <form id="assignMentorForm">
                            <div class="mb-3">
                                <label class="form-label">Select Student</label>
                                <select class="form-select" id="studentSelect" required>
                                    <option value="">Choose Student</option>
                                    ${(() => {
                                        const allStudents = database.users.filter(u => u.role === 'student');
                                        console.log('Dropdown rendering - ALL students:', allStudents);
                                        console.log('Dropdown rendering - students count:', allStudents.length);
                                        console.log('Sample student:', allStudents[0]);
                                        
                                        if (allStudents.length === 0) {
                                            console.log('NO STUDENTS FOUND!');
                                            return '<option value="">No students found</option>';
                                        }
                                        
                                        const studentOptions = allStudents.map(student => {
                                            const mentorName = student.mentorId ? database.users.find(u => u.id === student.mentorId)?.name || 'Unknown' : 'None';
                                            console.log(`Creating option for ${student.name}:`, mentorName);
                                            return `<option value="${student.id}">${student.name} (${student.studentId}) - Mentor: ${mentorName}</option>`;
                                        });
                                        
                                        console.log('Generated options:', studentOptions);
                                        return studentOptions.join('');
                                    })()}
                                </select>
                                <div class="mt-2">
                                    <small class="text-muted">
                                        Found ${database.users.filter(u => u.role === 'student').length} students. 
                                        <button type="button" class="btn btn-sm btn-outline-info ms-2" onclick="debugAdminDropdowns()">Debug</button>
                                    </small>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Select Mentor</label>
                                <select class="form-select" id="mentorSelect" required>
                                    <option value="">Choose Mentor</option>
                                    ${getMentors().map(mentor => 
                                        `<option value="${mentor.id}">${mentor.name} (${mentor.employeeId})</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-link me-1"></i>Assign Mentor
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-calendar-alt me-2"></i>Set Deadline</h5>
                    </div>
                    <div class="card-body">
                        <form id="deadlineForm">
                            <div class="mb-3">
                                <label class="form-label">Deadline Date</label>
                                <input type="datetime-local" class="form-control" id="deadlineDate" required min="">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="deadlineDescription" rows="2" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-success">
                                <i class="fas fa-clock me-1"></i>Set Deadline
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5><i class="fas fa-list me-2"></i>All Mentor Forms</h5>
            </div>
            <div class="card-body">
                ${getAllMentorForms()}
            </div>
        </div>
        
        <div class="text-center mt-3">
            <button class="btn btn-outline-warning" onclick="debugAdminDropdowns()">
                <i class="fas fa-bug me-1"></i>Debug Dropdowns
            </button>
            <button class="btn btn-outline-info ms-2" onclick="showAllStudentsForAdmin()">
                <i class="fas fa-users me-1"></i>Show All Students
            </button>
            <button class="btn btn-outline-success ms-2" onclick="assignSagarToVarsha()">
                <i class="fas fa-user-plus me-1"></i>Assign Sagar to Varsha
            </button>
        </div>
    `;
    
    // Setup admin dashboard event listeners
    document.getElementById('assignMentorForm').addEventListener('submit', handleAssignMentor);
    document.getElementById('deadlineForm').addEventListener('submit', handleSetDeadline);
    
    // Set minimum date for deadline input
    setTimeout(setMinDeadlineDate, 100);
}

// Debug admin dropdowns
function debugAdminDropdowns() {
    console.log('=== ADMIN DROPDOWN DEBUG ===');
    
    const allStudents = database.users.filter(u => u.role === 'student');
    const unassignedStudents = getUnassignedStudents();
    const allMentors = getMentors();
    
    console.log('1. ALL STUDENTS:', allStudents);
    console.log('2. UNASSIGNED STUDENTS:', unassignedStudents);
    console.log('3. ALL MENTORS:', allMentors);
    
    // Check if students have required fields
    allStudents.forEach(student => {
        console.log(`Student: ${student.name}, ID: ${student.id}, StudentID: ${student.studentId}, MentorID: ${student.mentorId}`);
    });
    
    // Show debug modal
    const debugInfo = `
        <h6>Dropdown Analysis:</h6>
        <div class="row">
            <div class="col-md-6">
                <h6>All Students (${allStudents.length}):</h6>
                <ul>
                    ${allStudents.map(s => `<li>${s.name} (${s.studentId}) - Mentor: ${s.mentorId || 'None'}</li>`).join('')}
                </ul>
            </div>
            <div class="col-md-6">
                <h6>Unassigned Students (${unassignedStudents.length}):</h6>
                <ul>
                    ${unassignedStudents.map(s => `<li>${s.name} (${s.studentId})</li>`).join('')}
                </ul>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-md-6">
                <h6>All Mentors (${allMentors.length}):</h6>
                <ul>
                    ${allMentors.map(m => `<li>${m.name} (${m.employeeId})</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    
    const modalHtml = `
        <div class="modal fade" id="adminDebugModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Admin Dropdown Debug</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${debugInfo}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('adminDebugModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('adminDebugModal'));
    modal.show();
    
    console.log('=== ADMIN DROPDOWN DEBUG END ===');
}

// Assign Sagar to Varsha Bangera specifically
function assignSagarToVarsha() {
    console.log('=== ASSIGNING SAGAR TO VARSHA ===');
    
    // Find Sagar (student)
    const sagar = database.users.find(u => u.role === 'student' && u.name && u.name.toLowerCase().includes('sagar'));
    console.log('Found Sagar:', sagar);
    
    // Find Varsha Bangera (mentor)
    const varsha = database.users.find(u => u.role === 'mentor' && u.name && u.name.toLowerCase().includes('varsha'));
    console.log('Found Varsha:', varsha);
    
    if (!sagar) {
        showToast('Sagar not found in database!', 'danger');
        return;
    }
    
    if (!varsha) {
        showToast('Varsha Bangera not found in database!', 'danger');
        return;
    }
    
    // Check if Sagar already has a mentor
    if (sagar.mentorId) {
        const existingMentor = database.users.find(u => u.id === sagar.mentorId);
        showToast(`Sagar already has mentor: ${existingMentor?.name || 'Unknown'}!`, 'warning');
        return;
    }
    
    // Assign Varsha as Sagar's mentor
    sagar.mentorId = varsha.id;
    
    // Create mentor assignment record
    const assignment = {
        id: generateId(),
        studentId: sagar.id,
        mentorId: varsha.id,
        assignedAt: new Date().toISOString(),
        assignedBy: 'admin_specific'
    };
    
    database.mentorAssignments.push(assignment);
    saveDatabase();
    
    console.log('Assignment created:', assignment);
    console.log('Updated Sagar:', sagar);
    
    // Notify Sagar about mentor assignment
    notifyStudent(sagar.id, `You have been assigned a new mentor: ${varsha.name}`);
    
    showToast(`Successfully assigned ${varsha.name} as mentor for ${sagar.name}!`, 'success');
    
    // Refresh admin dashboard
    setTimeout(() => {
        loadAdminDashboard();
    }, 1000);
    
    console.log('=== SAGAR TO VARSHA ASSIGNMENT COMPLETE ===');
}

// Show all students for admin debugging
function showAllStudentsForAdmin() {
    console.log('=== SHOWING ALL STUDENTS FOR ADMIN ===');
    
    const allStudents = database.users.filter(u => u.role === 'student');
    const unassignedStudents = getUnassignedStudents();
    const assignedStudents = database.users.filter(u => u.role === 'student' && u.mentorId);
    
    console.log('All students:', allStudents);
    console.log('Unassigned students:', unassignedStudents);
    console.log('Assigned students:', assignedStudents);
    
    // Show modal with all student data
    const studentsInfo = `
        <div class="row">
            <div class="col-md-4">
                <h6>All Students (${allStudents.length}):</h6>
                <ul style="max-height: 200px; overflow-y: auto;">
                    ${allStudents.map(s => `
                        <li>
                            <strong>${s.name}</strong> (${s.studentId})<br>
                            <small>Mentor: ${s.mentorId ? database.users.find(u => u.id === s.mentorId)?.name || 'Unknown' : 'None'}</small>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="col-md-4">
                <h6>Unassigned (${unassignedStudents.length}):</h6>
                <ul style="max-height: 200px; overflow-y: auto;">
                    ${unassignedStudents.map(s => `
                        <li><strong>${s.name}</strong> (${s.studentId})</li>
                    `).join('')}
                </ul>
            </div>
            <div class="col-md-4">
                <h6>Already Assigned (${assignedStudents.length}):</h6>
                <ul style="max-height: 200px; overflow-y: auto;">
                    ${assignedStudents.map(s => `
                        <li>
                            <strong>${s.name}</strong> (${s.studentId})<br>
                            <small>Mentor: ${database.users.find(u => u.id === s.mentorId)?.name || 'Unknown'}</small>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
    
    const modalHtml = `
        <div class="modal fade" id="allStudentsModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">All Students in Database</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${studentsInfo}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('allStudentsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('allStudentsModal'));
    modal.show();
    
    console.log('=== ALL STUDENTS DISPLAY COMPLETE ===');
}

// Load mentor dashboard
function loadMentorDashboard() {
    console.log('=== MENTOR DASHBOARD LOADING ===');
    
    // Refresh database to get latest data
    initializeDatabase();
    
    // Refresh current user data
    if (currentUser) {
        currentUser = database.users.find(u => u.id === currentUser.id);
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    const dashboardContent = document.getElementById('dashboardContent');
    const stats = getMentorStats();
    const assignedStudents = getAssignedStudents();
    
    console.log('Current user (mentor):', currentUser);
    console.log('All notifications:', JSON.parse(localStorage.getItem('notifications') || '[]'));
    
    const notifications = getNotificationsForUser(currentUser.id);
    console.log('Notifications for this mentor:', notifications);
    console.log('Assigned students:', assignedStudents);
    
    dashboardContent.innerHTML = `
        <div class="dashboard-header text-center">
            <h1><i class="fas fa-chalkboard-teacher me-2"></i>Mentor Dashboard</h1>
            <p class="lead">View assigned students and mentor forms</p>
        </div>
        
        ${notifications.length > 0 ? `
            <div class="alert alert-info alert-dismissible fade show" role="alert">
                <h6><i class="fas fa-bell me-2"></i>Recent Notifications (${notifications.length})</h6>
                <div class="mt-2">
                    ${notifications.map(notif => `
                        <div class="mb-2 p-2 bg-light rounded">
                            <small class="text-muted">${new Date(notif.timestamp).toLocaleString()}</small>
                            <p class="mb-0"><strong>${notif.message}</strong></p>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        ` : '<div class="alert alert-light"><p class="mb-0"><i class="fas fa-info-circle me-2"></i>No new notifications</p></div>'}
        
        <div class="row mb-4">
            <div class="col-md-4 mb-3">
                <div class="stats-card primary">
                    <div class="card-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>${stats.assignedStudents}</h3>
                    <p class="text-muted">Assigned Students</p>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="stats-card success">
                    <div class="card-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <h3>${stats.formsReceived}</h3>
                    <p class="text-muted">Forms Received</p>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="stats-card warning">
                    <div class="card-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h3>${stats.pendingForms}</h3>
                    <p class="text-muted">Pending Forms</p>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5><i class="fas fa-users me-2"></i>Assigned Students</h5>
            </div>
            <div class="card-body">
                ${assignedStudents.length > 0 ? `
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Student ID</th>
                                    <th>Semester</th>
                                    <th>Department</th>
                                    <th>Form Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${assignedStudents.map(student => `
                                    <tr>
                                        <td>${student.name}</td>
                                        <td>${student.studentId}</td>
                                        <td>${student.semester}</td>
                                        <td>${student.department}</td>
                                        <td>
                                            ${getStudentFormStatus(student.id)}
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-primary" onclick="viewStudentForm('${student.id}')">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-muted">No students assigned yet.</p>'}
            </div>
        </div>
        
        ${getCurrentDeadline() ? `
            <div class="alert alert-info mt-3">
                <h6><i class="fas fa-info-circle me-2"></i>Current Deadline</h6>
                <p class="mb-0">${getCurrentDeadline()}</p>
            </div>
        ` : ''}
        
        <div class="text-center mt-3">
            <button class="btn btn-outline-primary" onclick="refreshNotifications()">
                <i class="fas fa-sync-alt me-1"></i>Refresh Notifications
            </button>
            <button class="btn btn-outline-success ms-2" onclick="forceRefreshMentorData()">
                <i class="fas fa-redo me-1"></i>Force Refresh All Data
            </button>
            <button class="btn btn-outline-warning ms-2" onclick="showCurrentDataState()">
                <i class="fas fa-bug me-1"></i>Show Data State
            </button>
            <button class="btn btn-outline-danger ms-2" onclick="testBasicAssignment()">
                <i class="fas fa-vial me-1"></i>Test Assignment
            </button>
        </div>
    `;
    
    console.log('=== MENTOR DASHBOARD LOADED ===');
}

// Get notifications for specific user
function getNotificationsForUser(userId) {
    const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const userNotifications = allNotifications.filter(n => n.userId === userId && !n.read);
    
    // Mark notifications as read after displaying them
    if (userNotifications.length > 0) {
        userNotifications.forEach(notif => {
            notif.read = true;
        });
        localStorage.setItem('notifications', JSON.stringify(allNotifications));
    }
    
    return userNotifications;
}

// Refresh notifications for current user
function refreshNotifications() {
    console.log('Refreshing notifications...');
    loadMentorDashboard();
    showToast('Notifications refreshed!', 'info');
}

// Force refresh all mentor data
function forceRefreshMentorData() {
    console.log('=== FORCE REFRESHING ALL DATA ===');
    
    // Reinitialize everything
    initializeDatabase();
    
    // Refresh current user
    if (currentUser) {
        currentUser = database.users.find(u => u.id === currentUser.id);
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    // Reload dashboard
    loadMentorDashboard();
    showToast('All data refreshed!', 'success');
    
    console.log('=== FORCE REFRESH COMPLETE ===');
}

// Show current data state for debugging
function showCurrentDataState() {
    console.log('=== CURRENT DATA STATE DEBUG ===');
    console.log('Current User:', currentUser);
    console.log('All Users:', database.users);
    console.log('All Mentor Assignments:', database.mentorAssignments);
    console.log('All Mentor Forms:', database.mentorForms);
    
    // Find students assigned to current mentor
    const assignedStudents = database.users.filter(u => u.role === 'student' && u.mentorId === currentUser.id);
    console.log('Students assigned to current mentor:', assignedStudents);
    
    // Show in modal
    const modalHtml = `
        <div class="modal fade" id="debugModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Debug Data State</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Current User</h6>
                                <pre>${JSON.stringify(currentUser, null, 2)}</pre>
                            </div>
                            <div class="col-md-6">
                                <h6>Assigned Students (${assignedStudents.length})</h6>
                                <pre>${JSON.stringify(assignedStudents, null, 2)}</pre>
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <h6>All Mentor Assignments</h6>
                                <pre>${JSON.stringify(database.mentorAssignments, null, 2)}</pre>
                            </div>
                            <div class="col-md-6">
                                <h6>All Forms</h6>
                                <pre>${JSON.stringify(database.mentorForms, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('debugModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body and show it
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('debugModal'));
    modal.show();
    
    console.log('=== DEBUG DATA SHOWN ===');
}

// Test basic assignment functionality
function testBasicAssignment() {
    console.log('=== TESTING BASIC ASSIGNMENT ===');
    
    // Check if there are any users
    console.log('Total users:', database.users.length);
    console.log('Students:', database.users.filter(u => u.role === 'student').length);
    console.log('Mentors:', database.users.filter(u => u.role === 'mentor').length);
    
    // Check if there are any assignments
    console.log('Total assignments:', database.mentorAssignments.length);
    
    // Check current user
    console.log('Current mentor user:', currentUser);
    
    if (currentUser && currentUser.role === 'mentor') {
        // Manually check for students assigned to this mentor
        const mentorId = currentUser.id;
        const assignedStudents = database.users.filter(u => u.role === 'student' && u.mentorId === mentorId);
        
        console.log('Looking for students with mentorId:', mentorId);
        console.log('Found assigned students:', assignedStudents);
        
        // Also check assignments table
        const assignments = database.mentorAssignments.filter(a => a.mentorId === mentorId);
        console.log('Assignments from table:', assignments);
        
        // Create a test assignment if none exist
        if (assignedStudents.length === 0 && database.users.filter(u => u.role === 'student').length > 0) {
            console.log('Creating test assignment...');
            
            const testStudent = database.users.find(u => u.role === 'student');
            const testMentor = database.users.find(u => u.role === 'mentor');
            
            if (testStudent && testMentor) {
                // Create test assignment
                testStudent.mentorId = testMentor.id;
                
                const testAssignment = {
                    id: generateId(),
                    studentId: testStudent.id,
                    mentorId: testMentor.id,
                    assignedAt: new Date().toISOString(),
                    assignedBy: 'system'
                };
                
                database.mentorAssignments.push(testAssignment);
                saveDatabase();
                
                console.log('Test assignment created:', testAssignment);
                console.log('Test student updated:', testStudent);
                
                showToast('Test assignment created! Refresh dashboard.', 'success');
                
                // Refresh dashboard after 2 seconds
                setTimeout(() => {
                    loadMentorDashboard();
                }, 2000);
            }
        }
    }
    
    console.log('=== TEST ASSIGNMENT END ===');
}

// Load student dashboard
function loadStudentDashboard() {
    console.log('=== STUDENT DASHBOARD LOADING ===');
    
    // Refresh database to get latest data
    initializeDatabase();
    
    // Refresh current user data
    if (currentUser) {
        currentUser = database.users.find(u => u.id === currentUser.id);
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    const dashboardContent = document.getElementById('dashboardContent');
    
    console.log('Rendering student dashboard for:', currentUser);
    console.log('Current user mentorId:', currentUser.mentorId);
    console.log('All users:', database.users);
    
    // Get notifications for this student
    const notifications = getNotificationsForUser(currentUser.id);
    
    // Try multiple ways to find mentor
    let mentor = null;
    
    if (currentUser.mentorId) {
        mentor = database.users.find(u => u.id === currentUser.mentorId);
        console.log('Mentor found by ID:', mentor);
    }
    
    // If still no mentor, try to find from assignments
    if (!mentor) {
        const assignment = database.mentorAssignments.find(a => a.studentId === currentUser.id);
        console.log('Assignment found:', assignment);
        if (assignment) {
            mentor = database.users.find(u => u.id === assignment.mentorId);
            console.log('Mentor found from assignment:', mentor);
            // Update student record with mentorId
            currentUser.mentorId = assignment.mentorId;
            const student = database.users.find(u => u.id === currentUser.id);
            if (student) {
                student.mentorId = assignment.mentorId;
                saveDatabase();
            }
        }
    }
    
    const formStatus = getStudentFormStatus(currentUser.id);
    
    dashboardContent.innerHTML = `
        <div class="dashboard-header text-center">
            <h1><i class="fas fa-graduation-cap me-2"></i>Student Dashboard</h1>
            <p class="lead">View mentor information and submit mentor form</p>
        </div>
        
        ${notifications.length > 0 ? `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <h6><i class="fas fa-bell me-2"></i>Notifications</h6>
                <div class="mt-2">
                    ${notifications.map(notif => `
                        <div class="mb-2 p-2 bg-light rounded">
                            <small class="text-muted">${new Date(notif.timestamp).toLocaleString()}</small>
                            <p class="mb-0">${notif.message}</p>
                        </div>
                    `).join('')}
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        ` : ''}
        
        <!-- My Mentor Section -->
        <div class="card mb-4 border-primary">
            <div class="card-header bg-primary text-white">
                <h5><i class="fas fa-chalkboard-teacher me-2"></i>My Mentor</h5>
            </div>
            <div class="card-body">
                ${mentor ? `
                    <div class="row">
                        <div class="col-md-3">
                            <div class="text-center">
                                <div class="bg-primary text-white rounded-circle d-inline-block p-4 mb-3">
                                    <i class="fas fa-user-tie fa-2x"></i>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-9">
                            <h5 class="text-primary">${mentor.name}</h5>
                            <div class="row">
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Employee ID:</strong> ${mentor.employeeId || 'N/A'}</p>
                                    <p class="mb-1"><strong>Department:</strong> ${mentor.department || 'N/A'}</p>
                                </div>
                                <div class="col-md-6">
                                    <p class="mb-1"><strong>Email:</strong> ${mentor.email}</p>
                                    <p class="mb-1"><strong>Role:</strong> ${mentor.role.charAt(0).toUpperCase() + mentor.role.slice(1)}</p>
                                </div>
                            </div>
                            <div class="mt-2">
                                <span class="badge bg-success">Assigned</span>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="text-center py-3">
                        <div class="mb-3">
                            <i class="fas fa-user-slash fa-3x text-muted"></i>
                        </div>
                        <h5 class="text-muted">No Mentor Assigned Yet</h5>
                        <p class="text-muted">Please contact the administrator to get a mentor assigned.</p>
                        <button class="btn btn-outline-primary btn-sm" onclick="checkForMentorUpdate()">
                            <i class="fas fa-sync-alt me-1"></i>Check for Update
                        </button>
                    </div>
                `}
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-info-circle me-2"></i>Your Information</h5>
                    </div>
                    <div class="card-body">
                        <p><strong>Name:</strong> ${currentUser.name}</p>
                        <p><strong>Student ID:</strong> ${currentUser.studentId}</p>
                        <p><strong>Semester:</strong> ${currentUser.semester}</p>
                        <p><strong>Department:</strong> ${currentUser.department}</p>
                        <p><strong>Form Status:</strong> ${formStatus}</p>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-bell me-2"></i>Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary" onclick="refreshMentorInfo()">
                                <i class="fas fa-sync-alt me-1"></i>Refresh Mentor Info
                            </button>
                            <button class="btn btn-outline-success" onclick="forceRefreshStudentData()">
                <i class="fas fa-redo me-1"></i>Force Refresh All Data
            </button>
            <button class="btn btn-outline-warning ms-2" onclick="testDirectAssignment()">
                <i class="fas fa-magic me-1"></i>Test Direct Assignment
            </button>
            <button class="btn btn-outline-danger ms-2" onclick="showCompleteDebug()">
                <i class="fas fa-bug me-1"></i>Complete Debug
            </button>
            <button class="btn btn-outline-info" onclick="viewAllMentors()">
                <i class="fas fa-users me-1"></i>View All Mentors
            </button>
            <button class="btn btn-outline-success" onclick="contactAdmin()">
                <i class="fas fa-envelope me-1"></i>Contact Admin
            </button>
        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5><i class="fas fa-file-alt me-2"></i>Mentor Form</h5>
            </div>
            <div class="card-body">
                ${hasSubmittedForm(currentUser.id) ? `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>You have already submitted your mentor form.
                    </div>
                ` : `
                    <form id="mentorForm">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="form-label">IA1 Marks (out of 25)</label>
                                <input type="number" class="form-control" id="ia1Marks" min="0" max="25" required>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">IA2 Marks (out of 25)</label>
                                <input type="number" class="form-control" id="ia2Marks" min="0" max="25" required>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Total IA Marks (out of 50)</label>
                                <input type="number" class="form-control" id="iaMarks" min="0" max="50" readonly>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Semester Marks (out of 100)</label>
                                <input type="number" class="form-control" id="semMarks" min="0" max="100" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Attendance Percentage</label>
                                <input type="number" class="form-control" id="attendance" min="0" max="100" required>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Activities Participated</label>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="Sports" id="sports">
                                        <label class="form-check-label" for="sports">Sports</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="Cultural" id="cultural">
                                        <label class="form-check-label" for="cultural">Cultural</label>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="Technical" id="technical">
                                        <label class="form-check-label" for="technical">Technical</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="Workshop" id="workshop">
                                        <label class="form-check-label" for="workshop">Workshop</label>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="Seminar" id="seminar">
                                        <label class="form-check-label" for="seminar">Seminar</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="Project" id="project">
                                        <label class="form-check-label" for="project">Project</label>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="NSS" id="nss">
                                        <label class="form-check-label" for="nss">NSS</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" value="NCC" id="ncc">
                                        <label class="form-check-label" for="ncc">NCC</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Academic Performance Feedback</label>
                            <textarea class="form-control" id="academicFeedback" rows="2" placeholder="How are you performing in your studies? Any challenges?"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Personal Development Feedback</label>
                            <textarea class="form-control" id="personalFeedback" rows="2" placeholder="Any personal goals, achievements, or areas for improvement?"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Career Goals & Aspirations</label>
                            <textarea class="form-control" id="careerGoals" rows="2" placeholder="What are your career goals? How can we help you achieve them?"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Additional Comments</label>
                            <textarea class="form-control" id="comments" rows="3" placeholder="Any other information you'd like to share with your mentor..."></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane me-1"></i>Submit Mentor Form
                        </button>
                    </form>
                `}
            </div>
        </div>
        
        ${getCurrentDeadline() ? `
            <div class="alert alert-warning mt-3">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>Deadline Reminder</h6>
                <p class="mb-0">${getCurrentDeadline()}</p>
            </div>
        ` : ''}
    `;
    
    // Setup mentor form event listener
    if (!hasSubmittedForm(currentUser.id)) {
        document.getElementById('mentorForm').addEventListener('submit', handleMentorFormSubmit);
        
        // Add auto-calculation for IA marks
        document.getElementById('ia1Marks').addEventListener('input', calculateTotalIAMarks);
        document.getElementById('ia2Marks').addEventListener('input', calculateTotalIAMarks);
    }
}

// Helper functions for student dashboard
function checkForMentorUpdate() {
    console.log('Checking for mentor update...');
    
    // Refresh database and current user
    initializeDatabase();
    if (currentUser) {
        currentUser = database.users.find(u => u.id === currentUser.id);
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    // Reload dashboard
    loadStudentDashboard();
    showToast('Checking for mentor assignment updates...', 'info');
}

function refreshMentorInfo() {
    checkForMentorUpdate();
}

// Force refresh all student data
function forceRefreshStudentData() {
    console.log('=== FORCE REFRESHING STUDENT DATA ===');
    
    // Reinitialize everything
    initializeDatabase();
    
    // Refresh current user
    if (currentUser) {
        currentUser = database.users.find(u => u.id === currentUser.id);
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    }
    
    // Reload dashboard
    loadStudentDashboard();
    showToast('All data refreshed!', 'success');
    
    console.log('=== STUDENT DATA REFRESH COMPLETE ===');
}

// Test direct assignment for CURRENT student only
function testDirectAssignment() {
    console.log('=== TESTING DIRECT ASSIGNMENT FOR CURRENT STUDENT ONLY ===');
    
    // Get current student info
    console.log('Current student:', currentUser);
    
    // Find any available mentor
    const mentors = database.users.filter(u => u.role === 'mentor');
    console.log('Available mentors:', mentors);
    
    if (mentors.length === 0) {
        showToast('No mentors available in system!', 'danger');
        return;
    }
    
    // Assign first available mentor to CURRENT student only
    const selectedMentor = mentors[0];
    console.log('Selected mentor for CURRENT student assignment:', selectedMentor);
    
    // Update ONLY current student record in database
    const studentRecord = database.users.find(u => u.id === currentUser.id);
    if (studentRecord) {
        studentRecord.mentorId = selectedMentor.id;
        console.log('Updated CURRENT student record only:', studentRecord);
    }
    
    // Update ONLY current user object
    currentUser.mentorId = selectedMentor.id;
    console.log('Updated CURRENT user object only:', currentUser);
    
    // Create assignment record for CURRENT student only
    const assignment = {
        id: generateId(),
        studentId: currentUser.id, // Current student ID only
        mentorId: selectedMentor.id,
        assignedAt: new Date().toISOString(),
        assignedBy: 'student_test_current_only'
    };
    
    database.mentorAssignments.push(assignment);
    saveDatabase();
    
    console.log('Created assignment for CURRENT student only:', assignment);
    console.log('Database saved for CURRENT student only!');
    
    // Notify CURRENT student
    showToast(`Directly assigned mentor ${selectedMentor.name} to ${currentUser.name}! Refreshing dashboard...`, 'success');
    
    // Refresh dashboard after 2 seconds
    setTimeout(() => {
        loadStudentDashboard();
    }, 2000);
    
    console.log('=== DIRECT ASSIGNMENT TEST FOR CURRENT STUDENT COMPLETE ===');
}

// Complete debug function to analyze and fix mentor assignment
function showCompleteDebug() {
    console.log('=== COMPLETE DEBUG ANALYSIS ===');
    
    // Show all data
    console.log('1. CURRENT USER:', currentUser);
    console.log('2. ALL USERS:', database.users);
    console.log('3. ALL ASSIGNMENTS:', database.mentorAssignments);
    console.log('4. LOCALSTORAGE DATA:', localStorage.getItem('database'));
    
    // Find current student in database
    const dbStudent = database.users.find(u => u.id === currentUser.id);
    console.log('5. STUDENT IN DATABASE:', dbStudent);
    
    // Find assignments for this student
    const studentAssignments = database.mentorAssignments.filter(a => a.studentId === currentUser.id);
    console.log('6. ASSIGNMENTS FOR THIS STUDENT:', studentAssignments);
    
    // Find all mentors
    const mentors = database.users.filter(u => u.role === 'mentor');
    console.log('7. ALL MENTORS:', mentors);
    
    // Check if student has mentorId in database
    console.log('8. STUDENT MENTORID IN DB:', dbStudent?.mentorId);
    console.log('9. CURRENT USER MENTORID:', currentUser.mentorId);
    
    // Manual fix attempt - ONLY for current student
    if (mentors.length > 0 && !dbStudent?.mentorId) {
        console.log('10. ATTEMPTING MANUAL FIX FOR CURRENT STUDENT ONLY...');
        
        const firstMentor = mentors[0];
        console.log('Selected mentor:', firstMentor);
        
        // Update ONLY current student in database
        if (dbStudent) {
            dbStudent.mentorId = firstMentor.id;
            console.log('Updated current student in database:', dbStudent);
        }
        
        // Update ONLY current user object
        currentUser.mentorId = firstMentor.id;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('Updated current user object:', currentUser);
        
        // Create assignment ONLY for current student
        const assignment = {
            id: generateId(),
            studentId: currentUser.id, // Only current student
            mentorId: firstMentor.id,
            assignedAt: new Date().toISOString(),
            assignedBy: 'debug_fix_current'
        };
        
        database.mentorAssignments.push(assignment);
        saveDatabase();
        
        console.log('Created assignment for current student only:', assignment);
        console.log('Database saved for current student only!');
        
        showToast(`Manual fix applied for ${currentUser.name}! Refreshing dashboard...`, 'success');
        
        // Force refresh after 2 seconds
        setTimeout(() => {
            loadStudentDashboard();
        }, 2000);
    } else if (dbStudent?.mentorId) {
        console.log('Current student already has mentor:', dbStudent.mentorId);
        showToast('Current student already has a mentor assigned!', 'info');
    }
    
    // Show debug modal
    const debugInfo = `
        <h6>Debug Analysis:</h6>
        <ul>
            <li>Current User ID: ${currentUser.id}</li>
            <li>Current User MentorID: ${currentUser.mentorId || 'NULL'}</li>
            <li>Student in DB MentorID: ${dbStudent?.mentorId || 'NULL'}</li>
            <li>Total Mentors: ${mentors.length}</li>
            <li>Student Assignments: ${studentAssignments.length}</li>
        </ul>
        <h6>Recent Assignment:</h6>
        <pre>${JSON.stringify(studentAssignments[studentAssignments.length - 1] || 'None', null, 2)}</pre>
    `;
    
    const modalHtml = `
        <div class="modal fade" id="completeDebugModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Complete Debug Analysis</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${debugInfo}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('completeDebugModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal and show
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('completeDebugModal'));
    modal.show();
    
    console.log('=== COMPLETE DEBUG ANALYSIS END ===');
}

function viewAllMentors() {
    const mentors = database.users.filter(u => u.role === 'mentor');
    
    if (mentors.length === 0) {
        showToast('No mentors available in the system.', 'info');
        return;
    }
    
    let mentorsList = mentors.map(mentor => `
        <div class="col-md-6 mb-3">
            <div class="card">
                <div class="card-body">
                    <h6>${mentor.name}</h6>
                    <p class="mb-1"><strong>Employee ID:</strong> ${mentor.employeeId || 'N/A'}</p>
                    <p class="mb-1"><strong>Department:</strong> ${mentor.department || 'N/A'}</p>
                    <p class="mb-1"><strong>Email:</strong> ${mentor.email}</p>
                </div>
            </div>
        </div>
    `).join('');
    
    const modalHtml = `
        <div class="modal fade" id="mentorsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">All Available Mentors</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            ${mentorsList}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('mentorsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body and show it
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('mentorsModal'));
    modal.show();
}

function contactAdmin() {
    const admin = database.users.find(u => u.role === 'admin');
    
    if (admin) {
        const modalHtml = `
            <div class="modal fade" id="contactModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Contact Administrator</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Admin Name:</strong> ${admin.name}</p>
                            <p><strong>Email:</strong> ${admin.email}</p>
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                Please contact the administrator via email to request a mentor assignment.
                            </div>
                            <div class="d-grid">
                                <a href="mailto:${admin.email}?subject=Mentor Assignment Request - ${currentUser.name}" class="btn btn-primary">
                                    <i class="fas fa-envelope me-1"></i>Send Email
                                </a>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('contactModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('contactModal'));
        modal.show();
    } else {
        showToast('No administrator found in the system.', 'danger');
    }
}

// Calculate total IA marks automatically
function calculateTotalIAMarks() {
    const ia1Marks = parseInt(document.getElementById('ia1Marks').value) || 0;
    const ia2Marks = parseInt(document.getElementById('ia2Marks').value) || 0;
    const totalMarks = ia1Marks + ia2Marks;
    
    // Ensure total doesn't exceed 50
    const finalTotal = Math.min(totalMarks, 50);
    document.getElementById('iaMarks').value = finalTotal;
    
    // Show warning if exceeding limit
    if (totalMarks > 50) {
        showToast('Total IA marks cannot exceed 50!', 'warning');
    }
}

// Handle mentor form submission
function handleMentorFormSubmit(e) {
    e.preventDefault();
    
    console.log('=== MENTOR FORM SUBMISSION START ===');
    console.log('Current user:', currentUser);
    console.log('Current user mentorId:', currentUser.mentorId);
    
    const ia1Marks = document.getElementById('ia1Marks').value;
    const ia2Marks = document.getElementById('ia2Marks').value;
    const totalIAMarks = parseInt(ia1Marks) + parseInt(ia2Marks);
    const semMarks = document.getElementById('semMarks').value;
    const attendance = document.getElementById('attendance').value;
    const academicFeedback = document.getElementById('academicFeedback').value;
    const personalFeedback = document.getElementById('personalFeedback').value;
    const careerGoals = document.getElementById('careerGoals').value;
    const comments = document.getElementById('comments').value;
    
    // Update total IA marks field
    document.getElementById('iaMarks').value = totalIAMarks;
    
    // Get selected activities
    const activities = [];
    const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        activities.push(checkbox.value);
    });
    
    // Create mentor form
    const mentorForm = {
        id: generateId(),
        studentId: currentUser.id,
        studentName: currentUser.name,
        mentorId: currentUser.mentorId || 'unassigned',
        ia1Marks: parseInt(ia1Marks),
        ia2Marks: parseInt(ia2Marks),
        iaMarks: totalIAMarks,
        semMarks: parseInt(semMarks),
        attendance: parseInt(attendance),
        activities: activities,
        academicFeedback: academicFeedback,
        personalFeedback: personalFeedback,
        careerGoals: careerGoals,
        comments: comments,
        submittedAt: new Date().toISOString()
    };
    
    console.log('Created mentor form:', mentorForm);
    
    database.mentorForms.push(mentorForm);
    saveDatabase();
    
    console.log('Form saved to database');
    console.log('Total forms in database:', database.mentorForms.length);
    
    // Notify mentor if assigned
    if (currentUser.mentorId && currentUser.mentorId !== 'unassigned') {
        console.log('Notifying mentor:', currentUser.mentorId);
        notifyMentor(currentUser.mentorId, `New mentor form submitted by ${currentUser.name}`);
        
        // Also show immediate success toast with mentor info
        const mentor = database.users.find(u => u.id === currentUser.mentorId);
        if (mentor) {
            showToast(`Form submitted successfully! ${mentor.name} has been notified.`, 'success');
        }
    } else {
        showToast('Mentor form submitted successfully! (No mentor assigned)', 'warning');
    }
    
    loadStudentDashboard(); // Refresh dashboard
    console.log('=== MENTOR FORM SUBMISSION END ===');
}

// Handle assign mentor
function handleAssignMentor(e) {
    e.preventDefault();
    
    console.log('=== MENTOR ASSIGNMENT START ===');
    
    const studentId = document.getElementById('studentSelect').value;
    const mentorId = document.getElementById('mentorSelect').value;
    
    console.log('Selected studentId:', studentId);
    console.log('Selected mentorId:', mentorId);
    
    // Update student with mentor assignment
    const student = database.users.find(u => u.id === studentId);
    const mentor = database.users.find(u => u.id === mentorId);
    
    console.log('Found student:', student);
    console.log('Found mentor:', mentor);
    
    if (student && mentor) {
        const oldMentorId = student.mentorId;
        student.mentorId = mentorId;
        
        // Create mentor assignment record
        const assignment = {
            id: generateId(),
            studentId: studentId,
            mentorId: mentorId,
            assignedAt: new Date().toISOString(),
            assignedBy: currentUser.id
        };
        
        database.mentorAssignments.push(assignment);
        saveDatabase();
        
        console.log('Assignment created:', assignment);
        console.log('Updated student:', student);
        
        // Notify student about mentor assignment
        const message = oldMentorId 
            ? `Your mentor has been changed to ${mentor.name}`
            : `You have been assigned a new mentor: ${mentor.name}`;
        notifyStudent(studentId, message);
        
        const assignmentType = oldMentorId ? 'reassigned' : 'assigned';
        showToast(`Student ${student.name} ${assignmentType} to mentor ${mentor.name}!`, 'success');
        loadAdminDashboard(); // Refresh dashboard
        showToast(`Mentor ${mentor.name} assigned to student ${student.name}!`, 'success');
        loadAdminDashboard(); // Refresh admin dashboard
        
        // If mentor is logged in, refresh their dashboard too
        if (currentUser && currentUser.id === mentorId) {
            setTimeout(() => loadMentorDashboard(), 1000);
        }
    } else {
        showToast('Error: Could not find student or mentor!', 'danger');
    }
    
    console.log('=== MENTOR ASSIGNMENT END ===');
}

// Handle set deadline
function handleSetDeadline(e) {
    e.preventDefault();
    
    const deadlineDate = document.getElementById('deadlineDate').value;
    const description = document.getElementById('deadlineDescription').value;
    
    // Validate deadline date
    const selectedDate = new Date(deadlineDate);
    const now = new Date();
    
    if (!deadlineDate) {
        showToast('Please select a deadline date!', 'danger');
        return;
    }
    
    if (selectedDate <= now) {
        showToast('Deadline must be a future date!', 'danger');
        return;
    }
    
    if (!description || description.trim() === '') {
        showToast('Please enter a deadline description!', 'danger');
        return;
    }
    
    const deadline = {
        id: generateId(),
        deadline: deadlineDate,
        description: description.trim(),
        setBy: currentUser.id,
        setAt: new Date().toISOString()
    };
    
    database.deadlines.push(deadline);
    saveDatabase();
    
    // Notify all students
    const students = database.users.filter(u => u.role === 'student');
    students.forEach(student => {
        if (student.mentorId) {
            notifyStudent(student.id, `New deadline set: ${description}`);
        }
    });
    
    showToast('Deadline set successfully!', 'success');
    loadAdminDashboard(); // Refresh dashboard
}

// Helper functions
function getAdminStats() {
    return {
        totalUsers: database.users.length,
        totalMentors: database.users.filter(u => u.role === 'mentor').length,
        totalStudents: database.users.filter(u => u.role === 'student').length,
        totalForms: database.mentorForms.length
    };
}

function getMentorStats() {
    const assignedStudents = getAssignedStudents();
    const formsReceived = database.mentorForms.filter(f => f.mentorId === currentUser.id).length;
    
    return {
        assignedStudents: assignedStudents.length,
        formsReceived: formsReceived,
        pendingForms: assignedStudents.length - formsReceived
    };
}

function getMentors() {
    return database.users.filter(u => u.role === 'mentor');
}

function getStudents() {
    return database.users.filter(u => u.role === 'student');
}

function getUnassignedStudents() {
    const unassignedStudents = database.users.filter(u => u.role === 'student' && !u.mentorId);
    console.log('getUnassignedStudents - Total students:', database.users.filter(u => u.role === 'student').length);
    console.log('getUnassignedStudents - Unassigned students:', unassignedStudents);
    return unassignedStudents;
}

function getAssignedStudents() {
    const assignedStudents = database.users.filter(u => u.role === 'student' && u.mentorId === currentUser.id);
    console.log('getAssignedStudents - Current mentor ID:', currentUser.id);
    console.log('getAssignedStudents - All students with mentor:', database.users.filter(u => u.role === 'student' && u.mentorId));
    console.log('getAssignedStudents - Assigned students:', assignedStudents);
    return assignedStudents;
}

function getStudentById(studentId) {
    return database.users.find(u => u.id === studentId && u.role === 'student');
}

function getStudentMentor() {
    console.log('Current user:', currentUser);
    console.log('Current user mentorId:', currentUser?.mentorId);
    
    if (!currentUser || !currentUser.mentorId) {
        console.log('No mentorId found for current user');
        return null;
    }
    
    const mentor = database.users.find(u => u.id === currentUser.mentorId);
    console.log('Found mentor:', mentor);
    return mentor;
}

function hasSubmittedForm(studentId) {
    return database.mentorForms.some(f => f.studentId === studentId);
}

function getStudentFormStatus(studentId) {
    const form = database.mentorForms.find(f => f.studentId === studentId);
    if (form) {
        return '<span class="badge bg-success">Submitted</span>';
    } else {
        return '<span class="badge bg-warning">Pending</span>';
    }
}

function getCurrentDeadline() {
    const deadlines = database.deadlines;
    if (deadlines.length === 0) return null;
    
    const latestDeadline = deadlines[deadlines.length - 1];
    const deadlineDate = new Date(latestDeadline.deadline);
    const now = new Date();
    
    if (deadlineDate > now) {
        return `${latestDeadline.description} - Due: ${deadlineDate.toLocaleString()}`;
    }
    
    return null;
}

function getAllMentorForms() {
    const forms = database.mentorForms;
    
    if (forms.length === 0) {
        return '<p class="text-muted">No mentor forms submitted yet.</p>';
    }
    
    return `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>IA1 Marks</th>
                        <th>IA2 Marks</th>
                        <th>Total IA</th>
                        <th>Sem Marks</th>
                        <th>Attendance</th>
                        <th>Activities</th>
                        <th>Submitted At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${forms.map(form => `
                        <tr>
                            <td>${form.studentName}</td>
                            <td>${database.users.find(u => u.id === form.studentId)?.studentId || 'N/A'}</td>
                            <td>${form.ia1Marks || 'N/A'}</td>
                            <td>${form.ia2Marks || 'N/A'}</td>
                            <td>${form.iaMarks || 'N/A'}</td>
                            <td>${form.semMarks || 'N/A'}</td>
                            <td>${form.attendance ? form.attendance + '%' : 'N/A'}</td>
                            <td>${form.activities ? form.activities.join(', ') : 'N/A'}</td>
                            <td>${new Date(form.submittedAt).toLocaleString()}</td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="viewFormDetails('${form.id}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function viewFormDetails(formId) {
    const form = database.mentorForms.find(f => f.id === formId);
    if (!form) return;
    
    // Create modal to show form details
    const modalHtml = `
        <div class="modal fade" id="formModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Mentor Form Details - ${form.studentName}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-primary">Academic Information</h6>
                                <p><strong>IA1 Marks:</strong> ${form.ia1Marks || 'N/A'}/25</p>
                                <p><strong>IA2 Marks:</strong> ${form.ia2Marks || 'N/A'}/25</p>
                                <p><strong>Total IA Marks:</strong> ${form.iaMarks || 'N/A'}/50</p>
                                <p><strong>Semester Marks:</strong> ${form.semMarks || 'N/A'}/100</p>
                                <p><strong>Attendance:</strong> ${form.attendance ? form.attendance + '%' : 'N/A'}</p>
                                <p><strong>Activities:</strong> ${form.activities ? form.activities.join(', ') : 'None'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-primary">Student Information</h6>
                                <p><strong>Student Name:</strong> ${form.studentName}</p>
                                <p><strong>Student ID:</strong> ${database.users.find(u => u.id === form.studentId)?.studentId || 'N/A'}</p>
                                <p><strong>Submitted At:</strong> ${new Date(form.submittedAt).toLocaleString()}</p>
                                <p><strong>Mentor:</strong> ${form.mentorId === 'unassigned' ? 'Not Assigned' : (database.users.find(u => u.id === form.mentorId)?.name || 'N/A')}</p>
                            </div>
                        </div>
                        
                        ${form.academicFeedback ? `
                            <div class="mt-3">
                                <h6 class="text-primary">Academic Performance Feedback</h6>
                                <div class="border rounded p-3 bg-light">
                                    <p class="mb-0">${form.academicFeedback}</p>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${form.personalFeedback ? `
                            <div class="mt-3">
                                <h6 class="text-primary">Personal Development Feedback</h6>
                                <div class="border rounded p-3 bg-light">
                                    <p class="mb-0">${form.personalFeedback}</p>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${form.careerGoals ? `
                            <div class="mt-3">
                                <h6 class="text-primary">Career Goals & Aspirations</h6>
                                <div class="border rounded p-3 bg-light">
                                    <p class="mb-0">${form.careerGoals}</p>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${form.comments ? `
                            <div class="mt-3">
                                <h6 class="text-primary">Additional Comments</h6>
                                <div class="border rounded p-3 bg-light">
                                    <p class="mb-0">${form.comments}</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('formModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body and show it
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('formModal'));
    modal.show();
}

function viewStudentForm(studentId) {
    const form = database.mentorForms.find(f => f.studentId === studentId);
    if (!form) {
        showToast('No form submitted by this student yet.', 'info');
        return;
    }
    
    viewFormDetails(form.id);
}

function notifyMentor(mentorId, message) {
    console.log('Notifying mentor:', mentorId, 'Message:', message);
    
    // Store notification in localStorage
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.push({
        id: generateId(),
        userId: mentorId,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'mentor_form'
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Show immediate toast notification
    showToast(`Notification sent to mentor: ${message}`, 'info');
}

function notifyStudent(studentId, message) {
    console.log('Notifying student:', studentId, 'Message:', message);
    
    // Store notification in localStorage
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.push({
        id: generateId(),
        userId: studentId,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'mentor_assignment'
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Show immediate toast notification
    showToast(`Notification sent to student: ${message}`, 'info');
}

function showToast(message, type = 'info') {
    const toastElement = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toastElement.className = `toast align-items-center text-white bg-${type} border-0`;
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}
