import React, { useEffect, useState } from 'react';

const API_BASE = '/admin';
const AUTH_BASE = '/auth';
const pageSize = 50;

const sectionTitles = {
  dashboard: 'Dashboard',
  users: 'Quản lý Users',
  online: 'Users Online',
  banned: 'Users Bị Cấm',
  messages: 'Quản lý Tin nhắn',
  system: 'Hệ thống',
};

function Dashboard() {
  // Load external CSS and JS
  useEffect(() => {
    // Add Bootstrap CSS
    if (!document.querySelector('link[href*="bootstrap"]')) {
      const bootstrapLink = document.createElement('link');
      bootstrapLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css';
      bootstrapLink.rel = 'stylesheet';
      document.head.appendChild(bootstrapLink);
    }
    
    // Add FontAwesome CSS
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      fontAwesomeLink.rel = 'stylesheet';
      document.head.appendChild(fontAwesomeLink);
    }
    
    // Add Bootstrap JS
    if (!document.querySelector('script[src*="bootstrap"]')) {
      const bootstrapScript = document.createElement('script');
      bootstrapScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js';
      document.head.appendChild(bootstrapScript);
    }
  }, []);

  // Add custom CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --primary-color: #2563eb;
        --secondary-color: #64748b;
        --success-color: #16a34a;
        --danger-color: #dc2626;
        --warning-color: #ca8a04;
        --dark-color: #1e293b;
      }

      .sidebar {
        background: linear-gradient(180deg, var(--dark-color) 0%, #334155 100%);
        min-height: 100vh;
        box-shadow: 4px 0 10px rgba(0,0,0,0.1);
      }

      .sidebar .nav-link {
        color: #e2e8f0;
        padding: 12px 20px;
        margin: 4px 8px;
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .sidebar .nav-link:hover,
      .sidebar .nav-link.active {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        transform: translateX(4px);
      }

      .main-content {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        margin: 20px;
        padding: 30px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      }

      .stats-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: none;
        border-radius: 16px;
        padding: 25px;
        margin-bottom: 20px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        transition: all 0.3s ease;
      }

      .stats-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.12);
      }

      .stats-icon {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-bottom: 15px;
      }

      .icon-primary { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
      .icon-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
      .icon-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
      .icon-warning { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
      .icon-info { background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; }

      .table-container {
        background: white;
        border-radius: 16px;
        padding: 25px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        margin-top: 20px;
      }

      .table th {
        background: linear-gradient(135deg, #f8fafc, #e2e8f0);
        border: none;
        font-weight: 600;
        color: var(--dark-color);
        padding: 15px;
      }

      .badge-status {
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .btn-action {
        padding: 6px 12px;
        margin: 2px;
        border-radius: 8px;
        font-size: 12px;
        border: none;
        transition: all 0.3s ease;
      }

      .btn-action:hover {
        transform: scale(1.05);
      }

      .search-box {
        background: white;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 20px;
        transition: all 0.3s ease;
      }

      .search-box:focus {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        outline: none;
      }

      .refresh-btn {
        background: linear-gradient(135deg, var(--primary-color), #1d4ed8);
        border: none;
        border-radius: 12px;
        padding: 12px 24px;
        color: white;
        transition: all 0.3s ease;
      }

      .refresh-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        color: white;
      }

      .alert-custom {
        border: none;
        border-radius: 12px;
        padding: 16px 24px;
      }

      .modal-content {
        border-radius: 16px;
        border: none;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      }

      .modal-header {
        background: linear-gradient(135deg, var(--primary-color), #1d4ed8);
        color: white;
        border-radius: 16px 16px 0 0;
        border: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  // Auth state
  const [authToken, setAuthToken] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ studentId: '', birthDate: '' });
  const [alertList, setAlertList] = useState([]);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersLoading, setUsersLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [bufferStats, setBufferStats] = useState(null);
  const [banModal, setBanModal] = useState({ show: false, userId: '', reason: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [realtimeStatus] = useState(true);

  // On mount, check authentication
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const admin = localStorage.getItem('admin_info');
    if (token && admin) {
      setAuthToken(token);
      setAdminInfo(JSON.parse(admin));
      setShowLogin(false);
    } else {
      setShowLogin(true);
    }
  }, []);

  // On login, load dashboard
  useEffect(() => {
    if (authToken) {
      loadDashboardStats();
      if (currentSection === 'users') loadUsers(1);
      if (currentSection === 'online') loadOnlineUsers();
      if (currentSection === 'banned') loadBannedUsers();
      if (currentSection === 'system') loadBufferStats();
      // TODO: connectWebSocket();
    }
    // eslint-disable-next-line
  }, [authToken, currentSection]);

  // Helper: show alert
  function showAlert(message, type = 'info') {
    const id = Date.now();
    setAlertList((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlertList((prev) => prev.filter((a) => a.id !== id));
    }, 5000);
  }

  // Auth
  async function performLogin(e) {
    e.preventDefault();
    if (!loginForm.studentId || !loginForm.birthDate) {
      showAlert('Vui lòng nhập đầy đủ thông tin', 'warning');
      return;
    }
    try {
      const res = await fetch(`${AUTH_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const result = await res.json();
      if (res.ok) {
        // Check admin
        const check = await fetch(`${API_BASE}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${result.access_token}` },
        });
        if (check.ok) {
          setAuthToken(result.access_token);
          setAdminInfo(result.user);
          localStorage.setItem('admin_token', result.access_token);
          localStorage.setItem('admin_info', JSON.stringify(result.user));
          setShowLogin(false);
          showAlert(`Đăng nhập thành công! Chào mừng ${result.user.fullName}`, 'success');
        } else {
          showAlert('Bạn không có quyền admin để truy cập dashboard này', 'danger');
        }
      } else {
        showAlert(result.message || 'Đăng nhập thất bại', 'danger');
      }
    } catch {
      showAlert('Lỗi kết nối server', 'danger');
    }
  }

  function logout() {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      // TODO: disconnectWebSocket();
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      setAuthToken(null);
      setAdminInfo(null);
      setShowLogin(true);
    }
  }

  // Helper for authenticated fetch
  async function authenticatedFetch(url, options = {}) {
    const headers = {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 403) {
      showAlert('Phiên đăng nhập hết hạn', 'warning');
      logout();
      return null;
    }
    return res;
  }

  // Section switching
  function showSection(section) {
    setCurrentSection(section);
    setSearchResults(null);
    setSearchTerm('');
  }

  // Dashboard
  async function loadDashboardStats() {
    try {
      const res = await authenticatedFetch(`${API_BASE}/dashboard/stats`);
      if (!res) return;
      const data = await res.json();
      setStats(data);
    } catch {
      showAlert('Không thể tải thống kê dashboard', 'danger');
    }
  }

  // Users
  async function loadUsers(page = 1) {
    setUsersLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/users?page=${page}&limit=${pageSize}`);
      if (!res) return;
      const data = await res.json();
      setUsers(data.users);
      setUsersTotal(data.total);
      setUsersTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch {
      showAlert('Không thể tải danh sách users', 'danger');
    }
    setUsersLoading(false);
  }

  async function loadOnlineUsers() {
    setUsersLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/users/online`);
      if (!res) return;
      const data = await res.json();
      setOnlineUsers(data);
    } catch {
      showAlert('Không thể tải danh sách users online', 'danger');
    }
    setUsersLoading(false);
  }

  async function loadBannedUsers() {
    setUsersLoading(true);
    try {
      const res = await authenticatedFetch(`${API_BASE}/users/banned`);
      if (!res) return;
      const data = await res.json();
      setBannedUsers(data);
    } catch {
      showAlert('Không thể tải danh sách users bị cấm', 'danger');
    }
    setUsersLoading(false);
  }

  // System
  async function loadBufferStats() {
    try {
      const res = await authenticatedFetch(`${API_BASE}/buffer-stats`);
      if (!res) return;
      const data = await res.json();
      setBufferStats(data);
    } catch {
      setBufferStats(null);
      showAlert('Không thể tải thống kê buffer', 'danger');
    }
  }

  async function flushMessages() {
    if (!window.confirm('Bạn có chắc muốn flush tất cả messages về database?')) return;
    try {
      const res = await authenticatedFetch(`${API_BASE}/flush-messages`, { method: 'POST' });
      if (!res) return;
      await res.json();
      showAlert('Đã flush messages thành công', 'success');
      loadBufferStats();
    } catch {
      showAlert('Không thể flush messages', 'danger');
    }
  }

  // Ban/Unban
  function showBanModal(userId) {
    setBanModal({ show: true, userId, reason: '' });
  }
  function closeBanModal() {
    setBanModal({ show: false, userId: '', reason: '' });
  }
  async function confirmBanUser() {
    try {
      const res = await authenticatedFetch(`${API_BASE}/users/ban`, {
        method: 'POST',
        body: JSON.stringify({ userId: banModal.userId, reason: banModal.reason || 'Vi phạm quy định' }),
      });
      const result = await res.json();
      if (res.ok) {
        showAlert(`User ${banModal.userId} đã bị cấm thành công`, 'success');
        closeBanModal();
        loadSectionData(currentSection);
        loadDashboardStats();
      } else {
        showAlert(result.message || 'Không thể cấm user', 'danger');
      }
    } catch {
      showAlert('Lỗi khi cấm user', 'danger');
    }
  }
  async function unbanUser(userId) {
    if (!window.confirm(`Bạn có chắc muốn mở khóa user ${userId}?`)) return;
    try {
      const res = await authenticatedFetch(`${API_BASE}/users/unban`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      if (!res) return;
      const result = await res.json();
      if (res.ok) {
        showAlert(`User ${userId} đã được mở khóa`, 'success');
        loadSectionData(currentSection);
        loadDashboardStats();
      } else {
        showAlert(result.message || 'Không thể mở khóa user', 'danger');
      }
    } catch {
      showAlert('Lỗi khi mở khóa user', 'danger');
    }
  }

  // User details
  async function viewUserDetails(userId) {
    try {
      const res = await authenticatedFetch(`${API_BASE}/users/status?userId=${userId}`);
      if (!res) return;
      const users = await res.json();
      if (users.length > 0) {
        const user = users[0];
        let details = `Student ID: ${user.studentId}\nHọ tên: ${user.fullName}\nTrạng thái: ${user.isBanned ? 'Bị cấm' : (user.isActive ? 'Hoạt động' : 'Không hoạt động')}\nOnline: ${user.isOnline ? 'Có' : 'Không'}\nPhòng hiện tại: ${user.currentRoom || 'Không có'}\nLần cuối đăng nhập: ${formatDateTime(user.lastLogin)}`;
        if (user.isBanned) {
          details += `\nLý do cấm: ${user.bannedReason || '-'}\nCấm bởi: ${user.bannedBy || '-'}\nNgày cấm: ${formatDateTime(user.bannedAt)}`;
        }
        window.alert(details);
      } else {
        showAlert('Không tìm thấy user', 'warning');
      }
    } catch {
      showAlert('Không thể tải thông tin user', 'danger');
    }
  }

  // Search
  async function searchUser() {
    if (!searchTerm) {
      setSearchResults(null);
      loadUsers(1);
      return;
    }
    try {
      const res = await authenticatedFetch(`${API_BASE}/users/status?userId=${searchTerm}&studentId=${searchTerm}`);
      if (!res) return;
      const users = await res.json();
      setSearchResults(users);
    } catch {
      showAlert('Lỗi khi tìm kiếm user', 'danger');
    }
  }

  // Section data loader
  function loadSectionData(section) {
    switch (section) {
      case 'dashboard':
        loadDashboardStats();
        break;
      case 'users':
        loadUsers(1);
        break;
      case 'online':
        loadOnlineUsers();
        break;
      case 'banned':
        loadBannedUsers();
        break;
      case 'system':
        loadBufferStats();
        break;
      default:
        break;
    }
  }

  // Utility
  function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Render
  if (showLogin) {
    return (
      <div className="container d-flex align-items-center justify-content-center min-vh-100">
        <div className="card p-4 shadow-lg" style={{ minWidth: 350 }}>
          <h4 className="mb-3"><i className="fas fa-user-shield me-2"></i>Admin Login</h4>
          <form onSubmit={performLogin}>
            <div className="mb-3">
              <label className="form-label">Admin ID (Student ID):</label>
              <input type="text" className="form-control" value={loginForm.studentId} onChange={e => setLoginForm(f => ({ ...f, studentId: e.target.value }))} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password (Birth Date):</label>
              <input type="text" className="form-control" value={loginForm.birthDate} onChange={e => setLoginForm(f => ({ ...f, birthDate: e.target.value }))} required placeholder="dd/mm/yyyy" />
              <small className="form-text text-muted">Định dạng: dd/mm/yyyy</small>
            </div>
            <button type="submit" className="btn btn-primary w-100"><i className="fas fa-sign-in-alt me-2"></i>Login</button>
          </form>
          {alertList.map(a => (
            <div key={a.id} className={`alert alert-${a.type} mt-3`}>{a.message}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-2 col-lg-2 p-0">
          <div className="sidebar p-4" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)' }}>
            <h4 className="text-white mb-4"><i className="fas fa-cogs me-2"></i>Admin Panel</h4>
            <nav className="nav flex-column">
              {Object.keys(sectionTitles).map(section => (
                <a key={section} className={`nav-link${currentSection === section ? ' active' : ''}`} href="#" onClick={e => { e.preventDefault(); showSection(section); }} style={{ color: '#e2e8f0', borderRadius: 8, margin: '4px 8px', padding: '12px 20px' }}>
                  <i className={`fas ${{
                    dashboard: 'fa-tachometer-alt',
                    users: 'fa-users',
                    online: 'fa-circle text-success',
                    banned: 'fa-ban',
                    messages: 'fa-comments',
                    system: 'fa-server',
                  }[section]} me-2`}></i>
                  {sectionTitles[section]}
                </a>
              ))}
            </nav>
          </div>
        </div>
        {/* Main Content */}
        <div className="col-md-10 col-lg-10">
          <div className="main-content" style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 20, margin: 20, padding: 30, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 id="page-title">{sectionTitles[currentSection]}</h2>
                <small className="text-muted">Welcome, <span id="admin-name">{adminInfo?.fullName || 'Admin'}</span></small><br />
                <small id="realtime-status" className={realtimeStatus ? 'text-success' : 'text-danger'}>
                  <i className={`fas fa-circle ${realtimeStatus ? 'text-success' : 'text-danger'}`}></i> Realtime {realtimeStatus ? 'Connected' : 'Disconnected'}
                </small>
              </div>
              <div>
                <button className="btn btn-primary me-2" onClick={() => loadSectionData(currentSection)}><i className="fas fa-sync-alt me-2"></i>Refresh</button>
                <button className="btn btn-outline-danger" onClick={logout}><i className="fas fa-sign-out-alt me-2"></i>Logout</button>
              </div>
            </div>
            {/* Alerts */}
            <div id="alert-container">
              {alertList.map(a => (
                <div key={a.id} className={`alert alert-${a.type} alert-dismissible fade show`} role="alert">
                  {a.message}
                  <button type="button" className="btn-close" onClick={() => setAlertList(list => list.filter(x => x.id !== a.id))}></button>
                </div>
              ))}
            </div>
            {/* Sections */}
            {currentSection === 'dashboard' && (
              <div id="dashboard-section">
                <div className="row" id="stats-container">
                  <div className="col-md-6 col-lg-3">
                    <div className="stats-card">
                      <div className="stats-icon icon-primary"><i className="fas fa-users"></i></div>
                      <h3 className="mb-1" id="total-users">{stats.totalUsers || 0}</h3>
                      <p className="text-muted mb-0">Tổng Users</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="stats-card">
                      <div className="stats-icon icon-success"><i className="fas fa-circle"></i></div>
                      <h3 className="mb-1" id="online-users">{stats.onlineUsers || 0}</h3>
                      <p className="text-muted mb-0">Users Online</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="stats-card">
                      <div className="stats-icon icon-danger"><i className="fas fa-ban"></i></div>
                      <h3 className="mb-1" id="banned-users">{stats.bannedUsers || 0}</h3>
                      <p className="text-muted mb-0">Users Bị Cấm</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="stats-card">
                      <div className="stats-icon icon-info"><i className="fas fa-comments"></i></div>
                      <h3 className="mb-1" id="total-messages">{stats.totalMessages || 0}</h3>
                      <p className="text-muted mb-0">Tổng Tin nhắn</p>
                    </div>
                  </div>
                </div>
                <div className="row mt-4">
                  <div className="col-md-6">
                    <div className="stats-card">
                      <div className="stats-icon icon-warning"><i className="fas fa-home"></i></div>
                      <h3 className="mb-1" id="active-rooms">{stats.activeRooms || 0}</h3>
                      <p className="text-muted mb-0">Phòng Đang Hoạt động</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="stats-card">
                      <div className="stats-icon icon-primary"><i className="fas fa-buffer"></i></div>
                      <h3 className="mb-1" id="buffered-messages">{stats.bufferedMessages || 0}</h3>
                      <p className="text-muted mb-0">Tin nhắn Trong Buffer</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currentSection === 'users' && (
              <div id="users-section">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="flex-grow-1 me-3">
                    <input type="text" className="form-control search-box" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm kiếm user theo ID, tên..." />
                  </div>
                  <button className="btn btn-primary" onClick={searchUser}><i className="fas fa-search me-2"></i>Tìm kiếm</button>
                </div>
                <div className="table-container">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Danh sách Users</h5>
                    <div id="users-pagination" className="d-flex align-items-center">
                      <span className="me-3 text-muted" id="users-info">
                        {searchResults ? `Tìm thấy ${searchResults.length} kết quả` : `Trang ${currentPage} / ${usersTotalPages} (${usersTotal} users)`}
                      </span>
                      {!searchResults && (
                        <div className="btn-group" role="group">
                          <button className="btn btn-outline-primary btn-sm" onClick={() => loadUsers(currentPage - 1)} disabled={currentPage <= 1}><i className="fas fa-chevron-left"></i></button>
                          <button className="btn btn-outline-primary btn-sm" onClick={() => loadUsers(currentPage + 1)} disabled={currentPage >= usersTotalPages}><i className="fas fa-chevron-right"></i></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Họ Tên</th>
                          <th>Trạng thái</th>
                          <th>Online Status</th>
                          <th>Phòng Hiện tại</th>
                          <th>Lần Cuối Đăng nhập</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody id="users-table-body">
                        {usersLoading ? (
                          <tr><td colSpan={7} className="text-center py-4"><i className="fas fa-spinner fa-spin me-2"></i> Đang tải...</td></tr>
                        ) : (
                          (searchResults || users).length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-4">Không có dữ liệu</td></tr>
                          ) : (
                            (searchResults || users).map(user => (
                              <tr key={user.studentId}>
                                <td><strong>{user.studentId}</strong></td>
                                <td>{user.fullName}</td>
                                <td>
                                  <span className={`badge badge-status ${user.isBanned ? 'bg-danger' : (user.isActive ? 'bg-success' : 'bg-secondary')}`}>{user.isBanned ? 'Bị cấm' : (user.isActive ? 'Hoạt động' : 'Không hoạt động')}</span>
                                </td>
                                <td>
                                  <span className={`badge badge-status ${user.isOnline ? 'bg-success' : 'bg-secondary'}`}><i className="fas fa-circle me-1" style={{ fontSize: 8 }}></i>{user.isOnline ? 'Online' : 'Offline'}</span>
                                </td>
                                <td>{user.currentRoom || '-'}</td>
                                <td>{formatDateTime(user.lastLogin)}</td>
                                <td>
                                  {user.isBanned ? (
                                    <button className="btn btn-success btn-action" onClick={() => unbanUser(user.studentId)}><i className="fas fa-unlock me-1"></i> Mở khóa</button>
                                  ) : (
                                    <button className="btn btn-danger btn-action" onClick={() => showBanModal(user.studentId)}><i className="fas fa-ban me-1"></i> Cấm</button>
                                  )}
                                  <button className="btn btn-primary btn-action" onClick={() => viewUserDetails(user.studentId)}><i className="fas fa-eye me-1"></i> Chi tiết</button>
                                </td>
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {currentSection === 'online' && (
              <div id="online-section">
                <div className="table-container">
                  <h5 className="mb-3">Users Đang Online</h5>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Họ Tên</th>
                          <th>Phòng Hiện tại</th>
                          <th>Hoạt động Cuối</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody id="online-users-table-body">
                        {usersLoading ? (
                          <tr><td colSpan={5} className="text-center py-4"><i className="fas fa-spinner fa-spin me-2"></i> Đang tải...</td></tr>
                        ) : (
                          onlineUsers.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-4">Không có user online</td></tr>
                          ) : (
                            onlineUsers.map(user => (
                              <tr key={user.studentId}>
                                <td><strong>{user.studentId}</strong></td>
                                <td>{user.fullName}</td>
                                <td>{user.currentRoom || '-'}</td>
                                <td>{formatDateTime(user.lastActivity)}</td>
                                <td>
                                  {!user.isBanned && (
                                    <button className="btn btn-danger btn-action" onClick={() => showBanModal(user.studentId)}><i className="fas fa-ban me-1"></i> Cấm</button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {currentSection === 'banned' && (
              <div id="banned-section">
                <div className="table-container">
                  <h5 className="mb-3">Users Bị Cấm</h5>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Họ Tên</th>
                          <th>Lý do</th>
                          <th>Cấm bởi</th>
                          <th>Ngày cấm</th>
                          <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody id="banned-users-table-body">
                        {usersLoading ? (
                          <tr><td colSpan={6} className="text-center py-4"><i className="fas fa-spinner fa-spin me-2"></i> Đang tải...</td></tr>
                        ) : (
                          bannedUsers.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-4">Không có user bị cấm</td></tr>
                          ) : (
                            bannedUsers.map(user => (
                              <tr key={user.studentId}>
                                <td><strong>{user.studentId}</strong></td>
                                <td>{user.fullName}</td>
                                <td>{user.bannedReason || '-'}</td>
                                <td>{user.bannedBy || '-'}</td>
                                <td>{formatDateTime(user.bannedAt)}</td>
                                <td>
                                  <button className="btn btn-success btn-action" onClick={() => unbanUser(user.studentId)}><i className="fas fa-unlock me-1"></i> Mở khóa</button>
                                </td>
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {currentSection === 'messages' && (
              <div id="messages-section">
                <div className="alert alert-info alert-custom"><i className="fas fa-info-circle me-2"></i>Chức năng xóa tin nhắn sẽ được phát triển thêm. Hiện tại bạn có thể xóa tin nhắn thông qua API endpoints.</div>
              </div>
            )}
            {currentSection === 'system' && (
              <div id="system-section">
                <div className="row">
                  <div className="col-md-6">
                    <div className="table-container">
                      <h5 className="mb-3">Thống kê Buffer</h5>
                      <div id="buffer-stats">
                        {!bufferStats ? (
                          <div className="loading"><i className="fas fa-spinner fa-spin me-2"></i> Đang tải...</div>
                        ) : (
                          <div className="row">
                            <div className="col-6 mb-3"><strong>Pending Writes:</strong> <span className="badge bg-warning ms-2">{bufferStats.pendingWrites || 0}</span></div>
                            <div className="col-6 mb-3"><strong>Total Recent Messages:</strong> <span className="badge bg-info ms-2">{bufferStats.totalRecentMessages || 0}</span></div>
                            <div className="col-6 mb-3"><strong>Active Rooms:</strong> <span className="badge bg-success ms-2">{bufferStats.activeRooms || 0}</span></div>
                            <div className="col-6 mb-3"><strong>Batch Size:</strong> <span className="badge bg-secondary ms-2">{bufferStats.batchSize || 0}</span></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="table-container">
                      <h5 className="mb-3">Hành động Hệ thống</h5>
                      <button className="btn btn-warning mb-3" onClick={flushMessages}><i className="fas fa-database me-2"></i>Flush Messages to DB</button>
                      <p className="text-muted">Đẩy tất cả tin nhắn trong buffer về database</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Ban User Modal */}
            {banModal.show && (
              <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex={-1}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white' }}>
                      <h5 className="modal-title"><i className="fas fa-ban me-2"></i> Cấm User</h5>
                      <button type="button" className="btn-close btn-close-white" onClick={closeBanModal}></button>
                    </div>
                    <div className="modal-body">
                      <form onSubmit={e => { e.preventDefault(); confirmBanUser(); }}>
                        <div className="mb-3">
                          <label className="form-label">User ID:</label>
                          <input type="text" className="form-control" value={banModal.userId} readOnly />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Lý do cấm:</label>
                          <textarea className="form-control" value={banModal.reason} onChange={e => setBanModal(b => ({ ...b, reason: e.target.value }))} rows={3} placeholder="Nhập lý do cấm user..."></textarea>
                        </div>
                        <div className="alert alert-info"><i className="fas fa-info-circle me-2"></i>Hành động này sẽ được ghi nhận dưới tên admin đang đăng nhập</div>
                      </form>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={closeBanModal}>Hủy</button>
                      <button type="button" className="btn btn-danger" onClick={confirmBanUser}><i className="fas fa-ban me-2"></i> Cấm User</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
