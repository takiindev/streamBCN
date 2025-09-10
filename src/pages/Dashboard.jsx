import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API_CONFIG from '../config/api';

const API_BASE = API_CONFIG.ADMIN_URL;
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
    
    // Debug logging
    console.log('API Request:', url);
    console.log('Environment:', import.meta.env.PROD ? 'production' : 'development');
    console.log('API_BASE:', API_BASE);
    
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    
    try {
      const res = await fetch(url, { ...options, headers });
      
      console.log('API Response status:', res.status);
      
      if (res.status === 403) {
        showAlert('Phiên đăng nhập hết hạn', 'warning');
        handleLogout();
        return null;
      }
      
      if (!res.ok) {
        console.error('API Error:', res.status, res.statusText);
        const errorText = await res.text();
        console.error('Error details:', errorText);
      }
      
      return res;
    } catch (error) {
      console.error('Network error:', error);
      showAlert('Lỗi kết nối mạng', 'danger');
      return null;
    }
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
      <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white font-['Inter',sans-serif] min-h-screen flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-800 to-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-600 w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
              <i className="fas fa-shield-alt text-white text-lg sm:text-2xl"></i>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-300 text-sm sm:text-base">Đăng nhập để truy cập hệ thống quản trị</p>
          </div>
          
          <form onSubmit={performLogin} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Student ID</label>
              <input 
                type="text" 
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm sm:text-base"
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 text-sm sm:text-base"
                value={loginForm.birthDate} 
                onChange={e => setLoginForm(f => ({ ...f, birthDate: e.target.value }))} 
                required 
                placeholder="Nhập mật khẩu"
              />
              <p className="text-xs text-gray-400 mt-1">Định dạng: dd/mm/yyyy</p>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 hover:from-red-700 hover:via-blue-700 hover:to-purple-700 text-white py-2 sm:py-3 px-4 rounded-lg font-medium transition duration-200 shadow-lg text-sm sm:text-base"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Đăng nhập
            </button>
          </form>
          
          <div className="mt-4 sm:mt-6 space-y-2">
            {alertList.map(a => (
              <div key={a.id} className={`p-3 rounded-lg text-xs sm:text-sm border ${
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
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${currentSection === 'mobile-menu' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-slate-800 to-gray-800 border-r border-gray-600 shadow-2xl transform transition-transform duration-300 ${currentSection === 'mobile-menu' ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Mobile Sidebar Content */}
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                  <i className="fas fa-chart-line text-white text-sm sm:text-lg"></i>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">Admin Panel</h2>
              </div>
              <button 
                onClick={() => setCurrentSection('dashboard')}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            
            <nav className="space-y-1 sm:space-y-2">
              {Object.keys(sectionTitles).map(section => (
                <button
                  key={section}
                  className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 sm:space-x-3 ${
                    currentSection === section 
                      ? 'bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-slate-700'
                  }`}
                  onClick={() => {
                    showSection(section);
                  }}
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
                  } w-4 text-xs sm:text-sm`}></i>
                  <span className="text-xs sm:text-sm">{sectionTitles[section]}</span>
                </button>
              ))}
            </nav>
            
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-600">
              <div className="flex items-center mb-3 sm:mb-4 px-3 sm:px-4 py-2 sm:py-3 bg-slate-700 rounded-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-red-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                  <i className="fas fa-user text-white text-xs sm:text-sm"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">
                    {authenticatedUser?.fullName || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 flex items-center"
              >
                <i className="fas fa-sign-out-alt mr-2 sm:mr-3 w-4"></i>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar - Hidden on mobile/tablet */}
        <div className="hidden lg:flex lg:w-64 xl:w-72 2xl:w-80 bg-gradient-to-b from-slate-800 to-gray-800 border-r border-gray-600 shadow-2xl flex-shrink-0">
          <div className="w-full p-4 lg:p-6">
            <div className="flex items-center mb-6 lg:mb-8">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <i className="fas fa-chart-line text-white text-sm lg:text-lg"></i>
              </div>
              <h2 className="text-lg lg:text-xl font-semibold text-white">Admin Panel</h2>
            </div>
            
            <nav className="space-y-1 lg:space-y-2">
              {Object.keys(sectionTitles).map(section => (
                <button
                  key={section}
                  className={`w-full text-left px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 lg:space-x-3 ${
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
            
            <div className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-600">
              <div className="flex items-center mb-3 lg:mb-4 px-3 lg:px-4 py-2 lg:py-3 bg-slate-700 rounded-lg">
                <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-red-500 via-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-2 lg:mr-3">
                  <i className="fas fa-user text-white text-xs lg:text-sm"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium text-white truncate">
                    {authenticatedUser?.fullName || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 flex items-center"
              >
                <i className="fas fa-sign-out-alt mr-2 lg:mr-3 w-4"></i>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 w-0">
          {/* Header - Responsive */}
          <div className="bg-gradient-to-r from-slate-800 to-gray-800 border-b border-gray-600 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 shadow-lg flex-shrink-0">
            <div className="flex justify-between items-center">
              {/* Mobile Menu Button */}
              <div className="flex items-center lg:hidden">
                <button 
                  onClick={() => setCurrentSection('mobile-menu')}
                  className="p-2 text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors mr-3"
                >
                  <i className="fas fa-bars text-lg"></i>
                </button>
              </div>

              <div className="flex-1 lg:flex-none">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white truncate">{sectionTitles[currentSection]}</h1>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 hidden sm:block">Quản lý và giám sát hệ thống</p>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                <div className={`flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs font-medium ${
                  realtimeStatus 
                    ? 'bg-green-900/50 text-green-300 border border-green-600' 
                    : 'bg-red-900/50 text-red-300 border border-red-600'
                }`}>
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2 ${
                    realtimeStatus ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                  }`}></div>
                  <span className="hidden sm:inline">{realtimeStatus ? 'Online' : 'Offline'}</span>
                </div>
                <button 
                  onClick={() => loadSectionData(currentSection)}
                  className="px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-300 bg-slate-700 border border-gray-600 rounded-lg hover:bg-slate-600 hover:text-white transition-all duration-200 flex items-center shadow-lg"
                >
                  <i className="fas fa-sync-alt mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Content Area - Responsive Padding and Overflow */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto">
            {/* Alert Messages - Responsive */}
            {alertList.length > 0 && (
              <div className="space-y-2 mb-4 sm:mb-6">
                {alertList.map(a => (
                  <div key={a.id} className={`p-3 sm:p-4 rounded-lg border flex justify-between items-start ${
                    a.type === 'success' ? 'bg-green-900/50 text-green-300 border-green-600' :
                    a.type === 'danger' ? 'bg-red-900/50 text-red-300 border-red-600' :
                    a.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-600' :
                    'bg-blue-900/50 text-blue-300 border-blue-600'
                  }`}>
                    <span className="text-xs sm:text-sm flex-1 pr-2">{a.message}</span>
                    <button 
                      onClick={() => setAlertList(list => list.filter(x => x.id !== a.id))}
                      className="text-current hover:opacity-70 flex-shrink-0 p-1"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Dashboard Stats - Responsive Grid */}
            {currentSection === 'dashboard' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-4 sm:p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                        <i className="fas fa-users text-white text-lg sm:text-xl"></i>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-white truncate">{stats.totalUsers || 0}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Tổng Users</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-4 sm:p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex-shrink-0">
                        <i className="fas fa-circle text-white text-lg sm:text-xl"></i>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-white truncate">{stats.onlineUsers || 0}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Users Online</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-4 sm:p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg flex-shrink-0">
                        <i className="fas fa-ban text-white text-lg sm:text-xl"></i>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-white truncate">{stats.bannedUsers || 0}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Users Bị Cấm</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-4 sm:p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-xl shadow-lg flex-shrink-0">
                        <i className="fas fa-comments text-white text-lg sm:text-xl"></i>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-white truncate">{stats.totalMessages || 0}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Tổng Tin nhắn</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-4 sm:p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg flex-shrink-0">
                        <i className="fas fa-home text-white text-lg sm:text-xl"></i>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-white truncate">{stats.activeRooms || 0}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Phòng Đang Hoạt động</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-4 sm:p-6 rounded-xl border border-gray-600 shadow-2xl">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0">
                        <i className="fas fa-buffer text-white text-lg sm:text-xl"></i>
                      </div>
                      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-white truncate">{stats.bufferedMessages || 0}</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Tin nhắn Trong Buffer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Management Section - Responsive */}
            {currentSection === 'users' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <input 
                    type="text" 
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 text-sm sm:text-base"
                    placeholder="Tìm kiếm user theo ID, tên..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <button 
                    onClick={searchUser}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 text-white rounded-lg hover:from-red-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg text-sm sm:text-base whitespace-nowrap"
                  >
                    <i className="fas fa-search mr-2"></i>Tìm kiếm
                  </button>
                </div>

                <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                    <h3 className="text-base sm:text-lg font-medium text-white">Danh sách Users</h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                      <span className="text-xs sm:text-sm text-gray-300">
                        Trang {currentPage} / {totalPages} ({totalUsers} users)
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => loadUsers(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <button 
                          onClick={() => loadUsers(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border border-gray-600 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile/Tablet Card Layout */}
                  <div className="block lg:hidden">
                    <div className="divide-y divide-gray-600">
                      {isLoading ? (
                        <div className="px-4 sm:px-6 py-6 text-center text-gray-400">
                          <i className="fas fa-spinner fa-spin mr-2"></i>Đang tải...
                        </div>
                      ) : users.length === 0 ? (
                        <div className="px-4 sm:px-6 py-6 text-center text-gray-400">Không có dữ liệu</div>
                      ) : (
                        users.map(user => (
                          <div key={user.studentId} className="px-4 sm:px-6 py-4 hover:bg-slate-700/50">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-white truncate">{user.fullName}</h4>
                                  <p className="text-sm text-gray-300 font-mono">{user.studentId}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                    user.isOnline ? 'bg-green-900/50 text-green-300 border border-green-600' : 'bg-gray-700 text-gray-300 border border-gray-600'
                                  }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full mr-1 ${user.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                                    {user.isOnline ? 'Online' : 'Offline'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-gray-400">Trạng thái:</span>
                                  <div className="mt-1">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      user.isBanned ? 'bg-red-900/50 text-red-300 border border-red-600' :
                                      user.isActive ? 'bg-green-900/50 text-green-300 border border-green-600' : 'bg-gray-700 text-gray-300 border border-gray-600'
                                    }`}>
                                      {user.isBanned ? 'Bị cấm' : (user.isActive ? 'Hoạt động' : 'Không hoạt động')}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Phòng:</span>
                                  <p className="text-white mt-1 truncate">{user.currentRoom || '-'}</p>
                                </div>
                              </div>
                              
                              <div className="text-xs">
                                <span className="text-gray-400">Lần cuối:</span>
                                <p className="text-white mt-1">{formatDateTime(user.lastLogin)}</p>
                              </div>
                              
                              <div className="flex gap-2">
                                {user.isBanned ? (
                                  <button 
                                    onClick={() => openUnbanModal(user.studentId, user.fullName)}
                                    className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 shadow-lg"
                                  >
                                    <i className="fas fa-unlock mr-1"></i>Mở khóa
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => openBanModal(user.studentId, user.fullName)}
                                    className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-lg hover:from-red-700 hover:to-rose-800 shadow-lg"
                                  >
                                    <i className="fas fa-ban mr-1"></i>Cấm
                                  </button>
                                )}
                                <button 
                                  onClick={() => viewUserDetails(user.studentId)}
                                  className="flex-1 px-3 py-2 text-xs bg-gradient-to-r from-red-600 via-blue-600 to-purple-700 text-white rounded-lg hover:from-red-700 hover:via-blue-700 hover:to-purple-800 shadow-lg"
                                >
                                  <i className="fas fa-eye mr-1"></i>Chi tiết
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700">
                        <tr>
                          <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Student ID</th>
                          <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Họ Tên</th>
                          <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trạng thái</th>
                          <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Online Status</th>
                          <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phòng Hiện tại</th>
                          <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lần Cuối Đăng nhập</th>
                          <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-600">
                        {isLoading ? (
                          <tr>
                            <td colSpan="7" className="px-4 xl:px-6 py-4 text-center text-gray-400">
                              <i className="fas fa-spinner fa-spin mr-2"></i>Đang tải...
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-4 xl:px-6 py-4 text-center text-gray-400">Không có dữ liệu</td>
                          </tr>
                        ) : (
                          users.map(user => (
                            <tr key={user.studentId} className="hover:bg-slate-700/50">
                              <td className="px-4 xl:px-6 py-4 whitespace-nowrap font-medium text-white text-sm">{user.studentId}</td>
                              <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{user.fullName}</td>
                              <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 xl:px-3 py-1 text-xs font-semibold rounded-full ${
                                  user.isBanned ? 'bg-red-900/50 text-red-300 border border-red-600' :
                                  user.isActive ? 'bg-green-900/50 text-green-300 border border-green-600' : 'bg-gray-700 text-gray-300 border border-gray-600'
                                }`}>
                                  {user.isBanned ? 'Bị cấm' : (user.isActive ? 'Hoạt động' : 'Không hoạt động')}
                                </span>
                              </td>
                              <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 xl:px-3 py-1 text-xs font-semibold rounded-full ${
                                  user.isOnline ? 'bg-green-900/50 text-green-300 border border-green-600' : 'bg-gray-700 text-gray-300 border border-gray-600'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full mr-2 ${user.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                                  {user.isOnline ? 'Online' : 'Offline'}
                                </span>
                              </td>
                              <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{user.currentRoom || '-'}</td>
                              <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{formatDateTime(user.lastLogin)}</td>
                              <td className="px-4 xl:px-6 py-4 whitespace-nowrap space-x-1 xl:space-x-2">
                                {user.isBanned ? (
                                  <button 
                                    onClick={() => openUnbanModal(user.studentId, user.fullName)}
                                    className="px-2 xl:px-3 py-1 text-xs bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 shadow-lg"
                                  >
                                    <i className="fas fa-unlock mr-1"></i>Mở khóa
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => openBanModal(user.studentId, user.fullName)}
                                    className="px-2 xl:px-3 py-1 text-xs bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-lg hover:from-red-700 hover:to-rose-800 shadow-lg"
                                  >
                                    <i className="fas fa-ban mr-1"></i>Cấm
                                  </button>
                                )}
                                <button 
                                  onClick={() => viewUserDetails(user.studentId)}
                                  className="px-2 xl:px-3 py-1 text-xs bg-gradient-to-r from-red-600 via-blue-600 to-purple-700 text-white rounded-lg hover:from-red-700 hover:via-blue-700 hover:to-purple-800 shadow-lg"
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

            {/* Online Users Section - Responsive */}
            {currentSection === 'online' && (
              <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
                  <h3 className="text-base sm:text-lg font-medium text-white">Users Đang Online</h3>
                </div>
                
                {/* Mobile/Tablet Card Layout */}
                <div className="block lg:hidden">
                  <div className="divide-y divide-gray-600">
                    {isLoading ? (
                      <div className="px-4 sm:px-6 py-6 text-center text-gray-400">
                        <i className="fas fa-spinner fa-spin mr-2"></i>Đang tải...
                      </div>
                    ) : onlineUsers.length === 0 ? (
                      <div className="px-4 sm:px-6 py-6 text-center text-gray-400">Không có user online</div>
                    ) : (
                      onlineUsers.map(user => (
                        <div key={user.studentId} className="px-4 sm:px-6 py-4 hover:bg-slate-700/50">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white truncate">{user.fullName}</h4>
                                <p className="text-sm text-gray-300 font-mono">{user.studentId}</p>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-900/50 text-green-300 border border-green-600">
                                  <div className="w-1.5 h-1.5 rounded-full mr-1 bg-green-400 animate-pulse"></div>
                                  Online
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-gray-400">Phòng hiện tại:</span>
                                <p className="text-white mt-1 truncate">{user.currentRoom || '-'}</p>
                              </div>
                              <div>
                                <span className="text-gray-400">Hoạt động cuối:</span>
                                <p className="text-white mt-1">{formatDateTime(user.lastActivity)}</p>
                              </div>
                            </div>
                            
                            {!user.isBanned && (
                              <div>
                                <button 
                                  onClick={() => openBanModal(user.studentId, user.fullName)}
                                  className="w-full px-3 py-2 text-xs bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg"
                                >
                                  <i className="fas fa-ban mr-1"></i>Cấm
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Student ID</th>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Họ Tên</th>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phòng Hiện tại</th>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hoạt động Cuối</th>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {isLoading ? (
                        <tr>
                          <td colSpan="5" className="px-4 xl:px-6 py-4 text-center text-gray-400">
                            <i className="fas fa-spinner fa-spin mr-2"></i>Đang tải...
                          </td>
                        </tr>
                      ) : onlineUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 xl:px-6 py-4 text-center text-gray-400">Không có user online</td>
                        </tr>
                      ) : (
                        onlineUsers.map(user => (
                          <tr key={user.studentId} className="hover:bg-slate-700/50">
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap font-medium text-white text-sm">{user.studentId}</td>
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{user.fullName}</td>
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{user.currentRoom || '-'}</td>
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{formatDateTime(user.lastActivity)}</td>
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                              {!user.isBanned && (
                                <button 
                                  onClick={() => openBanModal(user.studentId, user.fullName)}
                                  className="px-2 xl:px-3 py-1 text-xs bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 shadow-lg"
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

            {/* Banned Users Section - Responsive */}
            {currentSection === 'banned' && (
              <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
                  <h3 className="text-base sm:text-lg font-medium text-white">Users Bị Cấm</h3>
                </div>
                
                {/* Mobile/Tablet Card Layout */}
                <div className="block lg:hidden">
                  <div className="divide-y divide-gray-600">
                    {isLoading ? (
                      <div className="px-4 sm:px-6 py-6 text-center text-gray-400">
                        <i className="fas fa-spinner fa-spin mr-2"></i>Đang tải...
                      </div>
                    ) : bannedUsers.length === 0 ? (
                      <div className="px-4 sm:px-6 py-6 text-center text-gray-400">Không có user bị cấm</div>
                    ) : (
                      bannedUsers.map(user => (
                        <div key={user.studentId} className="px-4 sm:px-6 py-4 hover:bg-slate-700/50">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white truncate">{user.fullName}</h4>
                                <p className="text-sm text-gray-300 font-mono">{user.studentId}</p>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-900/50 text-red-300 border border-red-600">
                                  <i className="fas fa-ban mr-1"></i>Bị cấm
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 text-xs">
                              <div>
                                <span className="text-gray-400">Lý do:</span>
                                <p className="text-white mt-1">{user.bannedReason || '-'}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <span className="text-gray-400">Cấm bởi:</span>
                                  <p className="text-white mt-1 truncate">{user.bannedBy || '-'}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Ngày cấm:</span>
                                  <p className="text-white mt-1">{formatDateTime(user.bannedAt)}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <button 
                                onClick={() => openUnbanModal(user.studentId, user.fullName)}
                                className="w-full px-3 py-2 text-xs bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 shadow-lg"
                              >
                                <i className="fas fa-unlock mr-1"></i>Mở khóa
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Student ID</th>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Họ Tên</th>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lý do</th>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cấm bởi</th>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ngày cấm</th>
                        <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {isLoading ? (
                        <tr>
                          <td colSpan="6" className="px-4 xl:px-6 py-4 text-center text-gray-400">
                            <i className="fas fa-spinner fa-spin mr-2"></i>Đang tải...
                          </td>
                        </tr>
                      ) : bannedUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 xl:px-6 py-4 text-center text-gray-400">Không có user bị cấm</td>
                        </tr>
                      ) : (
                        bannedUsers.map(user => (
                          <tr key={user.studentId} className="hover:bg-slate-700/50">
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap font-medium text-white text-sm">{user.studentId}</td>
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{user.fullName}</td>
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{user.bannedReason || '-'}</td>
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{user.bannedBy || '-'}</td>
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-gray-300 text-sm">{formatDateTime(user.bannedAt)}</td>
                            <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                              <button 
                                onClick={() => openUnbanModal(user.studentId, user.fullName)}
                                className="px-2 xl:px-3 py-1 text-xs bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 shadow-lg"
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

            {/* Messages Section - Responsive */}
            {currentSection === 'messages' && (
              <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
                  <h3 className="text-base sm:text-lg font-medium text-white">Quản lý Tin nhắn</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-blue-400 mt-1 mr-2 sm:mr-3 flex-shrink-0"></i>
                      <p className="text-blue-300 text-xs sm:text-sm">
                        Chức năng xóa tin nhắn sẽ được phát triển thêm. Hiện tại bạn có thể xóa tin nhắn thông qua API endpoints.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Section - Responsive */}
            {currentSection === 'system' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
                    <h3 className="text-base sm:text-lg font-medium text-white">Thống kê Buffer</h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-semibold text-white">{bufferStats.pendingWrites || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-400">Pending Writes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-semibold text-white">{bufferStats.totalRecentMessages || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-400">Total Recent Messages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-semibold text-white">{bufferStats.activeRooms || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-400">Active Rooms</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-semibold text-white">{bufferStats.batchSize || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-400">Batch Size</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl border border-gray-600 shadow-2xl">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-600">
                    <h3 className="text-base sm:text-lg font-medium text-white">Hành động Hệ thống</h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <button 
                      onClick={flushMessages}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 text-white rounded-lg hover:from-yellow-700 hover:via-orange-700 hover:to-red-700 transition-all duration-200 mb-2 sm:mb-3 shadow-lg text-sm sm:text-base"
                    >
                      <i className="fas fa-database mr-2"></i>Flush Messages to DB
                    </button>
                    <p className="text-xs sm:text-sm text-gray-400">Đẩy tất cả tin nhắn trong buffer về database</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Detail Modal - Responsive */}
      {showUserDetailModal && selectedUserDetail && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md mx-auto border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 px-4 sm:px-6 py-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <i className="fas fa-user text-white text-sm sm:text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Thông tin User</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Chi tiết tài khoản</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUserDetailModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <i className="fas fa-times text-lg sm:text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* Student ID */}
              <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-id-card text-blue-400 mr-2 sm:mr-3"></i>
                  <span className="text-gray-300 text-xs sm:text-sm">Student ID</span>
                </div>
                <p className="text-white font-mono text-sm sm:text-lg">{selectedUserDetail.studentId}</p>
              </div>

              {/* Họ tên */}
              <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-user text-green-400 mr-2 sm:mr-3"></i>
                  <span className="text-gray-300 text-xs sm:text-sm">Họ và tên</span>
                </div>
                <p className="text-white font-semibold text-sm sm:text-base">{selectedUserDetail.fullName}</p>
              </div>

              {/* Trạng thái */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="bg-gray-700 rounded-lg p-2 sm:p-3 border border-gray-600">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-circle text-yellow-400 mr-1 sm:mr-2"></i>
                    <span className="text-gray-300 text-xs">Trạng thái</span>
                  </div>
                  <p className={`text-xs sm:text-sm font-medium ${
                    selectedUserDetail.isBanned ? 'text-red-400' : 
                    selectedUserDetail.isActive ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {selectedUserDetail.isBanned ? 'Bị cấm' : 
                     selectedUserDetail.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-2 sm:p-3 border border-gray-600">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-wifi text-blue-400 mr-1 sm:mr-2"></i>
                    <span className="text-gray-300 text-xs">Online</span>
                  </div>
                  <p className={`text-xs sm:text-sm font-medium ${
                    selectedUserDetail.isOnline ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    {selectedUserDetail.isOnline ? 'Có' : 'Không'}
                  </p>
                </div>
              </div>

              {/* Phòng hiện tại */}
              <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-door-open text-purple-400 mr-2 sm:mr-3"></i>
                  <span className="text-gray-300 text-xs sm:text-sm">Phòng hiện tại</span>
                </div>
                <p className="text-white text-sm sm:text-base">{selectedUserDetail.currentRoom || 'Không có'}</p>
              </div>

              {/* Lần cuối đăng nhập */}
              <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-clock text-orange-400 mr-2 sm:mr-3"></i>
                  <span className="text-gray-300 text-xs sm:text-sm">Lần cuối đăng nhập</span>
                </div>
                <p className="text-white font-mono text-xs sm:text-sm">{formatDateTime(selectedUserDetail.lastLogin)}</p>
              </div>

              {/* Thông tin cấm (nếu có) */}
              {selectedUserDetail.isBanned && (
                <div className="bg-red-900/30 rounded-lg p-3 sm:p-4 border border-red-600">
                  <div className="flex items-center mb-3">
                    <i className="fas fa-ban text-red-400 mr-2 sm:mr-3"></i>
                    <span className="text-red-300 font-medium text-sm sm:text-base">Thông tin cấm</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-red-200 text-xs sm:text-sm">Lý do:</span>
                      <p className="text-white text-sm sm:text-base">{selectedUserDetail.bannedReason || '-'}</p>
                    </div>
                    <div>
                      <span className="text-red-200 text-xs sm:text-sm">Cấm bởi:</span>
                      <p className="text-white text-sm sm:text-base">{selectedUserDetail.bannedBy || '-'}</p>
                    </div>
                    <div>
                      <span className="text-red-200 text-xs sm:text-sm">Ngày cấm:</span>
                      <p className="text-white font-mono text-xs sm:text-sm">{formatDateTime(selectedUserDetail.bannedAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-800 px-4 sm:px-6 py-4 border-t border-gray-700">
              <button 
                onClick={() => setShowUserDetailModal(false)}
                className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 via-blue-600 to-purple-600 text-white rounded-lg hover:from-red-700 hover:via-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg text-sm sm:text-base"
              >
                <i className="fas fa-check mr-2"></i>Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal - Responsive */}
      {showBanModal && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl w-full max-w-md border border-gray-600 shadow-2xl">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-white">
                  <i className="fas fa-ban mr-2 text-red-400"></i>Cấm User
                </h3>
                <button 
                  onClick={() => setShowBanModal(false)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Tên User:</label>
                <input 
                  type="text" 
                  value={banUserName} 
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-semibold text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Student ID:</label>
                <input 
                  type="text" 
                  value={banUserId} 
                  readOnly
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 font-mono text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Lý do cấm:</label>
                <textarea 
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows="3"
                  placeholder="Nhập lý do cấm user..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-400 text-sm sm:text-base"
                />
              </div>
              
              <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-blue-300">
                  <i className="fas fa-info-circle mr-2"></i>
                  Hành động này sẽ được ghi nhận dưới tên admin đang đăng nhập
                </p>
              </div>
            </div>
            
            <div className="px-4 sm:px-6 py-4 border-t border-gray-600">
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button 
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmBanUser}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-pink-700 text-white rounded-lg hover:from-red-700 hover:via-rose-700 hover:to-pink-800 transition-colors shadow-lg text-sm sm:text-base"
                >
                  <i className="fas fa-ban mr-2"></i>Cấm User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unban Confirmation Modal - Responsive */}
      {showUnbanModal && (
        <div className="fixed inset-0 bg-gray-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-800 to-gray-800 rounded-xl w-full max-w-md border border-gray-600 shadow-2xl">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <i className="fas fa-unlock text-white text-sm sm:text-lg"></i>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Xác nhận mở khóa</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Gỡ bỏ lệnh cấm user</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUnbanModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <i className="fas fa-times text-lg sm:text-xl"></i>
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* Tên User */}
              <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-user text-green-400 mr-2 sm:mr-3"></i>
                  <span className="text-gray-300 text-xs sm:text-sm">Tên User</span>
                </div>
                <p className="text-white font-semibold text-sm sm:text-lg">{unbanUserName}</p>
              </div>

              {/* Student ID */}
              <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
                <div className="flex items-center mb-2">
                  <i className="fas fa-id-card text-blue-400 mr-2 sm:mr-3"></i>
                  <span className="text-gray-300 text-xs sm:text-sm">Student ID</span>
                </div>
                <p className="text-white font-mono text-sm sm:text-base">{unbanUserId}</p>
              </div>

              {/* Cảnh báo */}
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 sm:p-4">
                <div className="flex items-center mb-2">
                  <i className="fas fa-exclamation-triangle text-yellow-400 mr-2 sm:mr-3"></i>
                  <span className="text-yellow-300 font-medium text-sm sm:text-base">Xác nhận hành động</span>
                </div>
                <p className="text-yellow-200 text-xs sm:text-sm">
                  Bạn có chắc chắn muốn mở khóa user này? User sẽ có thể truy cập lại hệ thống ngay lập tức.
                </p>
              </div>

              {/* Thông tin admin */}
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-blue-300">
                  <i className="fas fa-info-circle mr-2"></i>
                  Hành động này sẽ được ghi nhận dưới tên admin đang đăng nhập
                </p>
              </div>
            </div>
            
            <div className="px-4 sm:px-6 py-4 border-t border-gray-600">
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button 
                  onClick={() => setShowUnbanModal(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmUnbanUser}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white rounded-lg hover:from-green-700 hover:via-emerald-700 hover:to-teal-800 transition-colors shadow-lg text-sm sm:text-base"
                >
                  <i className="fas fa-unlock mr-2"></i>Mở khóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;