import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = '/admin';
const pageSize = 7;

const sectionTitles = {
  dashboard: 'Dashboard',
  users: 'Quản lý Users',
  online: 'Users Online',
  banned: 'Users Bị Cấm',
  messages: 'Quản lý Tin nhắn',
  system: 'Hệ thống',
};

function Dashboard() {
  const { isAuthenticated, user: authenticatedUser, login: authLogin, logout: authLogout } = useAuth();

  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesomeLink = document.createElement('link');
      fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      fontAwesomeLink.rel = 'stylesheet';
      document.head.appendChild(fontAwesomeLink);
    }
  }, []);

  const [loginForm, setLoginForm] = useState({ studentId: '', birthDate: '' });
  const [alertList, setAlertList] = useState([]);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [realtimeStatus] = useState(true);
  
  // New state for user management
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [showBanModal, setShowBanModal] = useState(false);
  const [banUserId, setBanUserId] = useState('');
  const [banUserName, setBanUserName] = useState('');
  const [banReason, setBanReason] = useState('');
  const [bufferStats, setBufferStats] = useState({});
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [unbanUserId, setUnbanUserId] = useState('');
  const [unbanUserName, setUnbanUserName] = useState('');

  useEffect(() => {
    if (isAuthenticated && authenticatedUser) {
      loadDashboardStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authenticatedUser, currentSection]);

  function showAlert(message, type = 'info') {
    const id = Date.now();
    setAlertList((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlertList((prev) => prev.filter((a) => a.id !== id));
    }, 5000);
  }

  async function performLogin(e) {
    e.preventDefault();
    if (!loginForm.studentId || !loginForm.birthDate) {
      showAlert('Vui lòng nhập đầy đủ thông tin', 'warning');
      return;
    }
    try {
      await authLogin(loginForm.studentId, loginForm.birthDate);
      showAlert('Đăng nhập thành công!', 'success');
    } catch (error) {
      showAlert(error.message || 'Đăng nhập thất bại', 'danger');
    }
  }

  function handleLogout() {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      authLogout();
    }
  }

  async function authenticatedFetch(url, options = {}) {
    const token = authenticatedUser?.access_token || localStorage.getItem('admin_token');
    if (!token) {
      showAlert('Chưa đăng nhập', 'warning');
      return null;
    }
    
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 403) {
      showAlert('Phiên đăng nhập hết hạn', 'warning');
      handleLogout();
      return null;
    }
    return res;
  }

  function showSection(section) {
    setCurrentSection(section);
    loadSectionData(section);
  }

  function loadSectionData(section) {
    switch(section) {
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

  async function loadUsers(page = 1) {
    try {
      setIsLoading(true);
      const res = await authenticatedFetch(`${API_BASE}/users?page=${page}&limit=${pageSize}`);
      if (!res) return;
      const data = await res.json();
      
      setUsers(data.users || []);
      setCurrentPage(page);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
    } catch (error) {
      console.error('Error loading users:', error);
      showAlert('Không thể tải danh sách users', 'danger');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOnlineUsers() {
    try {
      setIsLoading(true);
      const res = await authenticatedFetch(`${API_BASE}/users/online`);
      if (!res) return;
      const data = await res.json();
      setOnlineUsers(data || []);
    } catch (error) {
      console.error('Error loading online users:', error);
      showAlert('Không thể tải danh sách users online', 'danger');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadBannedUsers() {
    try {
      setIsLoading(true);
      const res = await authenticatedFetch(`${API_BASE}/users/banned`);
      if (!res) return;
      const data = await res.json();
      setBannedUsers(data || []);
    } catch (error) {
      console.error('Error loading banned users:', error);
      showAlert('Không thể tải danh sách users bị cấm', 'danger');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadBufferStats() {
    try {
      const res = await authenticatedFetch(`${API_BASE}/buffer-stats`);
      if (!res) return;
      const data = await res.json();
      setBufferStats(data);
    } catch (error) {
      console.error('Error loading buffer stats:', error);
      showAlert('Không thể tải thống kê buffer', 'danger');
    }
  }

  async function searchUser() {
    if (!userSearch.trim()) {
      loadUsers(1);
      return;
    }

    try {
      setIsLoading(true);
      const res = await authenticatedFetch(`${API_BASE}/users/status?userId=${userSearch}&studentId=${userSearch}`);
      if (!res) return;
      const data = await res.json();
      setUsers(data || []);
      setTotalUsers(data.length);
      setTotalPages(1);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error searching user:', error);
      showAlert('Lỗi khi tìm kiếm user', 'danger');
    } finally {
      setIsLoading(false);
    }
  }

  function openBanModal(userId, fullName) {
    setBanUserId(userId);
    setBanUserName(fullName);
    setBanReason('');
    setShowBanModal(true);
  }

  async function confirmBanUser() {
    if (!banUserId || !banReason.trim()) {
      showAlert('Vui lòng nhập lý do cấm', 'warning');
      return;
    }

    try {
      const res = await authenticatedFetch(`${API_BASE}/users/ban`, {
        method: 'POST',
        body: JSON.stringify({
          userId: banUserId,
          reason: banReason || 'Vi phạm quy định'
        })
      });

      if (!res) return;
      const result = await res.json();
      
      if (res.ok) {
        showAlert(`${banUserName} đã bị cấm thành công`, 'success');
        setShowBanModal(false);
        loadSectionData(currentSection);
        loadDashboardStats();
      } else {
        showAlert(result.message || 'Không thể cấm user', 'danger');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      showAlert('Lỗi khi cấm user', 'danger');
    }
  }

  function openUnbanModal(userId, fullName) {
    setUnbanUserId(userId);
    setUnbanUserName(fullName);
    setShowUnbanModal(true);
  }

  async function confirmUnbanUser() {
    try {
      const res = await authenticatedFetch(`${API_BASE}/users/unban`, {
        method: 'POST',
        body: JSON.stringify({ userId: unbanUserId })
      });

      if (!res) return;
      const result = await res.json();
      
      if (res.ok) {
        showAlert(`${unbanUserName} đã được mở khóa`, 'success');
        setShowUnbanModal(false);
        loadSectionData(currentSection);
        loadDashboardStats();
      } else {
        showAlert(result.message || 'Không thể mở khóa user', 'danger');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      showAlert('Lỗi khi mở khóa user', 'danger');
    }
  }

  async function viewUserDetails(userId) {
    try {
      const res = await authenticatedFetch(`${API_BASE}/users/status?userId=${userId}`);
      if (!res) return;
      const data = await res.json();
      
      if (data.length > 0) {
        const user = data[0];
        setSelectedUserDetail(user);
        setShowUserDetailModal(true);
      } else {
        showAlert('Không tìm thấy user', 'warning');
      }
    } catch (error) {
      console.error('Error viewing user details:', error);
      showAlert('Không thể tải thông tin user', 'danger');
    }
  }

  async function flushMessages() {
    if (!window.confirm('Bạn có chắc muốn flush tất cả messages về database?')) return;
    
    try {
      const res = await authenticatedFetch(`${API_BASE}/flush-messages`, { method: 'POST' });
      if (!res) return;
      
      showAlert('Đã flush messages thành công', 'success');
      loadBufferStats();
    } catch (error) {
      console.error('Error flushing messages:', error);
      showAlert('Không thể flush messages', 'danger');
    }
  }

  function formatDateTime(dateString) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white font-['Inter',sans-serif] min-h-screen flex items-center justify-center">
        <div className="bg-gradient-to-b from-slate-800 to-gray-800 p-8 rounded-xl shadow-2xl border border-gray-600 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <i className="fas fa-shield-alt text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-300">Đăng nhập để truy cập hệ thống quản trị</p>
          </div>
          
          <form onSubmit={performLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Student ID</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                value={loginForm.studentId} 
                onChange={e => setLoginForm(f => ({ ...f, studentId: e.target.value }))} 
                required 
                placeholder="Nhập Student ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                value={loginForm.birthDate} 
                onChange={e => setLoginForm(f => ({ ...f, birthDate: e.target.value }))} 
                required 
                placeholder="Nhập mật khẩu"
              />
              <p className="text-xs text-gray-400 mt-1">Định dạng: dd/mm/yyyy</p>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 hover:from-red-700 hover:via-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition duration-200 shadow-lg"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Đăng nhập
            </button>
          </form>
          
          <div className="mt-6 space-y-2">
            {alertList.map(a => (
              <div key={a.id} className={`p-3 rounded-lg text-sm border ${
                a.type === 'success' ? 'bg-green-900 text-green-300 border-green-600' :
                a.type === 'danger' ? 'bg-red-900 text-red-300 border-red-600' :
                a.type === 'warning' ? 'bg-yellow-900 text-yellow-300 border-yellow-600' :
                'bg-blue-900 text-blue-300 border-blue-600'
              }`}>
                {a.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white font-['Inter',sans-serif] min-h-screen">
      <div className="flex h-screen">
        <div className="w-64 bg-gradient-to-b from-slate-800 to-gray-800 border-r border-gray-600 shadow-2xl">
          <div className="p-6">
            <div className="flex items-center mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <i className="fas fa-chart-line text-white text-lg"></i>
              </div>
              <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
            </div>
            
            <nav className="space-y-2">
              {Object.keys(sectionTitles).map(section => (
                <button
                  key={section}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-3 ${
                    currentSection === section 
                      ? 'bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-700'
                  }`}
                  onClick={() => showSection(section)}
                >
                  <i className={`fas ${
                    {
                      dashboard: 'fa-tachometer-alt',
                      users: 'fa-users',
                      online: 'fa-circle text-green-400',
                      banned: 'fa-ban',
                      messages: 'fa-comments',
                      system: 'fa-server',
                    }[section]
                  } w-4`}></i>
                  <span>{sectionTitles[section]}</span>
                </button>
              ))}
            </nav>
            
            <div className="mt-8 pt-6 border-t border-gray-600">
              <div className="flex items-center mb-4 px-4 py-3 bg-slate-700 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {authenticatedUser?.fullName || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 flex items-center"
              >
                <i className="fas fa-sign-out-alt mr-3 w-4"></i>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-gradient-to-r from-slate-800 to-gray-800 border-b border-gray-600 px-6 py-4 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white">{sectionTitles[currentSection]}</h1>
                <p className="text-sm text-gray-300 mt-1">Quản lý và giám sát hệ thống</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center px-3 py-2 rounded-full text-xs font-medium ${
                  realtimeStatus 
                    ? 'bg-green-900/50 text-green-300 border border-green-600' 
                    : 'bg-red-900/50 text-red-300 border border-red-600'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    realtimeStatus ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                  }`}></div>
                  {realtimeStatus ? 'Online' : 'Offline'}
                </div>
                <button 
                  onClick={() => loadSectionData(currentSection)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-700 border border-gray-600 rounded-lg hover:bg-slate-600 hover:text-white transition-all duration-200 flex items-center shadow-lg"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  Làm mới
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {alertList.length > 0 && (
              <div className="space-y-2 mb-6">
                {alertList.map(a => (
                  <div key={a.id} className={`p-4 rounded-lg border flex justify-between items-center ${
                    a.type === 'success' ? 'bg-green-900/50 text-green-300 border-green-600' :
                    a.type === 'danger' ? 'bg-red-900/50 text-red-300 border-red-600' :
                    a.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-600' :
                    'bg-blue-900/50 text-blue-300 border-blue-600'
                  }`}>
                    <span className="text-sm">{a.message}</span>
                    <button 
                      onClick={() => setAlertList(list => list.filter(x => x.id !== a.id))}
                      className="text-current hover:opacity-70 ml-4"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {currentSection === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-xl shadow-lg">
                        <i className="fas fa-users text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-white">{stats.totalUsers || 0}</h3>
                        <p className="text-sm text-gray-400">Tổng Users</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                        <i className="fas fa-circle text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-white">{stats.onlineUsers || 0}</h3>
                        <p className="text-sm text-gray-400">Users Online</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                        <i className="fas fa-ban text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-white">{stats.bannedUsers || 0}</h3>
                        <p className="text-sm text-gray-400">Users Bị Cấm</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-xl shadow-lg">
                        <i className="fas fa-comments text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-white">{stats.totalMessages || 0}</h3>
                        <p className="text-sm text-gray-400">Tổng Tin nhắn</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
                        <i className="fas fa-home text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-white">{stats.activeRooms || 0}</h3>
                        <p className="text-sm text-gray-400">Phòng Đang Hoạt động</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                        <i className="fas fa-buffer text-white text-xl"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-white">{stats.bufferedMessages || 0}</h3>
                        <p className="text-sm text-gray-400">Tin nhắn Trong Buffer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'users' && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    className="flex-1 px-4 py-3 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    placeholder="Tìm kiếm user theo ID, tên..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <button 
                    onClick={searchUser}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 text-white rounded-lg hover:from-red-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                  >
                    <i className="fas fa-search mr-2"></i>Tìm kiếm
                  </button>
                </div>

                <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                  <div className="px-6 py-4 border-b border-gray-600 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">Danh sách Users</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-300">
                        Trang {currentPage} / {totalPages} ({totalUsers} users)
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => loadUsers(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="px-3 py-2 text-sm border border-gray-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <button 
                          onClick={() => loadUsers(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="px-3 py-2 text-sm border border-gray-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Student ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Họ Tên</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Online Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phòng Hiện tại</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lần Cuối Đăng nhập</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {isLoading ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                              <i className="fas fa-spinner fa-spin mr-2"></i>Đang tải...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-gray-400">Không có dữ liệu</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.studentId} className="hover:bg-slate-700/50">
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{user.studentId}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.fullName}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                  user.isBanned ? 'bg-red-900/50 text-red-300 border border-red-600' :
                                  user.isActive ? 'bg-green-900/50 text-green-300 border border-green-600' : 'bg-gray-700 text-gray-300 border border-gray-600'
                                }`}>
                                  {user.isBanned ? 'Bị cấm' : (user.isActive ? 'Hoạt động' : 'Không hoạt động')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                  user.isOnline ? 'bg-green-900/50 text-green-300 border border-green-600' : 'bg-gray-700 text-gray-300 border border-gray-600'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full mr-2 ${user.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                                  {user.isOnline ? 'Online' : 'Offline'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.currentRoom || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatDateTime(user.lastLogin)}</td>
                              <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                {user.isBanned ? (
                                  <button 
                                    onClick={() => openUnbanModal(user.studentId, user.fullName)}
                                    className="px-3 py-1 text-xs bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 shadow-lg"
                                  >
                                    <i className="fas fa-unlock mr-1"></i>Mở khóa
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => openBanModal(user.studentId, user.fullName)}
                                    className="px-3 py-1 text-xs bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-lg hover:from-red-700 hover:to-rose-800 shadow-lg"
                                  >
                                    <i className="fas fa-ban mr-1"></i>Cấm
                                  </button>
                                )}
                                <button 
                                  onClick={() => viewUserDetails(user.studentId)}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-red-600 via-blue-600 to-purple-700 text-white rounded-lg hover:from-red-700 hover:via-blue-700 hover:to-purple-800 shadow-lg"
                                >
                                  <i className="fas fa-eye mr-1"></i>Chi tiết
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'online' && (
              <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                <div className="px-6 py-4 border-b border-gray-600">
                  <h3 className="text-lg font-medium text-white">Users Đang Online</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Họ Tên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phòng Hiện tại</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hoạt động Cuối</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {isLoading ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                            <i className="fas fa-spinner fa-spin mr-2"></i>Đang tải...
                          </td>
                        </tr>
                      ) : onlineUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-400">Không có user online</td>
                        </tr>
                      ) : (
                        onlineUsers.map(user => (
                          <tr key={user.studentId} className="hover:bg-slate-700/50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{user.studentId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.fullName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.currentRoom || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatDateTime(user.lastActivity)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {!user.isBanned && (
                                <button 
                                  onClick={() => openBanModal(user.studentId, user.fullName)}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg"
                                >
                                  <i className="fas fa-ban mr-1"></i>Cấm
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentSection === 'banned' && (
              <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                <div className="px-6 py-4 border-b border-gray-600">
                  <h3 className="text-lg font-medium text-white">Users Bị Cấm</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Họ Tên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lý do</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cấm bởi</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ngày cấm</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {isLoading ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-gray-400">
                            <i className="fas fa-spinner fa-spin mr-2"></i>Đang tải...
                          </td>
                        </tr>
                      ) : bannedUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-4 text-center text-gray-400">Không có user bị cấm</td>
                        </tr>
                      ) : (
                        bannedUsers.map(user => (
                          <tr key={user.studentId} className="hover:bg-slate-700/50">
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{user.studentId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.fullName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.bannedReason || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.bannedBy || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{formatDateTime(user.bannedAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button 
                                onClick={() => openUnbanModal(user.studentId, user.fullName)}
                                className="px-3 py-1 text-xs bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 shadow-lg"
                              >
                                <i className="fas fa-unlock mr-1"></i>Mở khóa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {currentSection === 'messages' && (
              <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                <div className="px-6 py-4 border-b border-gray-600">
                  <h3 className="text-lg font-medium text-white">Quản lý Tin nhắn</h3>
                </div>
                <div className="p-6">
                  <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-4">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-blue-400 mt-1 mr-3"></i>
                      <p className="text-blue-300 text-sm">
                        Chức năng xóa tin nhắn sẽ được phát triển thêm. Hiện tại bạn có thể xóa tin nhắn thông qua API endpoints.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentSection === 'system' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                  <div className="px-6 py-4 border-b border-gray-600">
                    <h3 className="text-lg font-medium text-white">Thống kê Buffer</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-white">{bufferStats.pendingWrites || 0}</div>
                        <div className="text-sm text-gray-400">Pending Writes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-white">{bufferStats.totalRecentMessages || 0}</div>
                        <div className="text-sm text-gray-400">Total Recent Messages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-white">{bufferStats.activeRooms || 0}</div>
                        <div className="text-sm text-gray-400">Active Rooms</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-white">{bufferStats.batchSize || 0}</div>
                        <div className="text-sm text-gray-400">Batch Size</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                  <div className="px-6 py-4 border-b border-gray-600">
                    <h3 className="text-lg font-medium text-white">Hành động Hệ thống</h3>
                  </div>
                  <div className="p-6">
                    <button 
                      onClick={flushMessages}
                      className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 text-white rounded-lg hover:from-yellow-700 hover:via-orange-700 hover:to-red-700 transition-all duration-200 mb-3 shadow-lg"
                    >
                      <i className="fas fa-database mr-2"></i>Flush Messages to DB
                    </button>
                    <p className="text-sm text-gray-400">Đẩy tất cả tin nhắn trong buffer về database</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUserDetail && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <i className="fas fa-user text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Thông tin User</h3>
                  <p className="text-gray-400 text-sm">Chi tiết tài khoản</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUserDetailModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* Student ID */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-id-card text-blue-400 mr-3"></i>
                  <span className="text-gray-300 text-sm">Student ID</span>
                </div>
                <p className="text-white font-mono text-lg">{selectedUserDetail.studentId}</p>
              </div>

              {/* Họ tên */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-user text-green-400 mr-3"></i>
                  <span className="text-gray-300 text-sm">Họ và tên</span>
                </div>
                <p className="text-white font-semibold">{selectedUserDetail.fullName}</p>
              </div>

              {/* Trạng thái */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-circle text-yellow-400 mr-2"></i>
                    <span className="text-gray-300 text-xs">Trạng thái</span>
                  </div>
                  <p className={`text-sm font-medium ${
                    selectedUserDetail.isBanned ? 'text-red-400' : 
                    selectedUserDetail.isActive ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {selectedUserDetail.isBanned ? 'Bị cấm' : 
                     selectedUserDetail.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-wifi text-blue-400 mr-2"></i>
                    <span className="text-gray-300 text-xs">Online</span>
                  </div>
                  <p className={`text-sm font-medium ${
                    selectedUserDetail.isOnline ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {selectedUserDetail.isOnline ? 'Có' : 'Không'}
                  </p>
                </div>
              </div>

              {/* Phòng hiện tại */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-door-open text-purple-400 mr-3"></i>
                  <span className="text-gray-300 text-sm">Phòng hiện tại</span>
                </div>
                <p className="text-white">{selectedUserDetail.currentRoom || 'Không có'}</p>
              </div>

              {/* Lần cuối đăng nhập */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-clock text-orange-400 mr-3"></i>
                  <span className="text-gray-300 text-sm">Lần cuối đăng nhập</span>
                </div>
                <p className="text-white font-mono text-sm">{formatDateTime(selectedUserDetail.lastLogin)}</p>
              </div>

              {/* Thông tin cấm (nếu có) */}
              {selectedUserDetail.isBanned && (
                <div className="bg-red-900/30 rounded-lg p-4 border border-red-600">
                  <div className="flex items-center mb-3">
                    <i className="fas fa-ban text-red-400 mr-3"></i>
                    <span className="text-red-300 font-medium">Thông tin cấm</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-red-200 text-sm">Lý do:</span>
                      <p className="text-white">{selectedUserDetail.bannedReason || '-'}</p>
                    </div>
                    <div>
                      <span className="text-red-200 text-sm">Cấm bởi:</span>
                      <p className="text-white">{selectedUserDetail.bannedBy || '-'}</p>
                    </div>
                    <div>
                      <span className="text-red-200 text-sm">Ngày cấm:</span>
                      <p className="text-white font-mono text-sm">{formatDateTime(selectedUserDetail.bannedAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowUserDetailModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 text-white rounded-lg hover:from-red-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                <i className="fas fa-check mr-2"></i>Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-600 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                <i className="fas fa-ban mr-2 text-red-400"></i>Cấm User
              </h3>
              <button 
                onClick={() => setShowBanModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tên User:</label>
                <input 
                  type="text" 
                  value={banUserName} 
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Student ID:</label>
                <input 
                  type="text" 
                  value={banUserId} 
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 font-mono"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Lý do cấm:</label>
                <textarea 
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows="3"
                  placeholder="Nhập lý do cấm user..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400"
                />
              </div>
              
              <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  <i className="fas fa-info-circle mr-2"></i>
                  Hành động này sẽ được ghi nhận dưới tên admin đang đăng nhập
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowBanModal(false)}
                className="px-4 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={confirmBanUser}
                className="px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-pink-700 text-white rounded-lg hover:from-red-700 hover:via-rose-700 hover:to-pink-800 transition-colors shadow-lg"
              >
                <i className="fas fa-ban mr-2"></i>Cấm User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal */}
      {showUnbanModal && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-600 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                  <i className="fas fa-unlock text-white text-lg"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Xác nhận mở khóa</h3>
                  <p className="text-gray-400 text-sm">Gỡ bỏ lệnh cấm user</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUnbanModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              {/* Tên User */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-user text-green-400 mr-3"></i>
                  <span className="text-gray-300 text-sm">Tên User</span>
                </div>
                <p className="text-white font-semibold text-lg">{unbanUserName}</p>
              </div>

              {/* Student ID */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-id-card text-blue-400 mr-3"></i>
                  <span className="text-gray-300 text-sm">Student ID</span>
                </div>
                <p className="text-white font-mono">{unbanUserId}</p>
              </div>

              {/* Cảnh báo */}
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <i className="fas fa-exclamation-triangle text-yellow-400 mr-3"></i>
                  <span className="text-yellow-300 font-medium">Xác nhận hành động</span>
                </div>
                <p className="text-yellow-200 text-sm">
                  Bạn có chắc chắn muốn mở khóa user này? User sẽ có thể truy cập lại hệ thống ngay lập tức.
                </p>
              </div>

              {/* Thông tin admin */}
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  <i className="fas fa-info-circle mr-2"></i>
                  Hành động này sẽ được ghi nhận dưới tên admin đang đăng nhập
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowUnbanModal(false)}
                className="px-4 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={confirmUnbanUser}
                className="px-4 py-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white rounded-lg hover:from-green-700 hover:via-emerald-700 hover:to-teal-800 transition-colors shadow-lg"
              >
                <i className="fas fa-unlock mr-2"></i>Mở khóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;