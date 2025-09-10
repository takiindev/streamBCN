import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = '/admin';

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

  useEffect(() => {
    if (isAuthenticated && authenticatedUser) {
      loadDashboardStats();
    }
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
  }

  function loadSectionData(section) {
    if (section === 'dashboard') loadDashboardStats();
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
              <i className="fas fa-shield-alt text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Đăng nhập để truy cập hệ thống quản trị</p>
          </div>
          
          <form onSubmit={performLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                value={loginForm.studentId} 
                onChange={e => setLoginForm(f => ({ ...f, studentId: e.target.value }))} 
                required 
                placeholder="Nhập Student ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                value={loginForm.birthDate} 
                onChange={e => setLoginForm(f => ({ ...f, birthDate: e.target.value }))} 
                required 
                placeholder="Nhập mật khẩu"
              />
              <p className="text-xs text-gray-500 mt-1">Định dạng: dd/mm/yyyy</p>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2 px-4 rounded-md font-medium transition duration-200"
            >
              Đăng nhập
            </button>
          </form>
          
          <div className="mt-6 space-y-2">
            {alertList.map(a => (
              <div key={a.id} className={`p-3 rounded-md text-sm border ${
                a.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                a.type === 'danger' ? 'bg-red-50 text-red-800 border-red-200' :
                a.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                'bg-blue-50 text-blue-800 border-blue-200'
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 bg-slate-700 rounded-md flex items-center justify-center mr-3">
                <i className="fas fa-chart-line text-white text-sm"></i>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            </div>
            
            <nav className="space-y-1">
              {Object.keys(sectionTitles).map(section => (
                <button
                  key={section}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 flex items-center space-x-3 ${
                    currentSection === section 
                      ? 'bg-slate-100 text-slate-900 border-r-2 border-slate-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => showSection(section)}
                >
                  <i className={`fas ${
                    {
                      dashboard: 'fa-tachometer-alt',
                      users: 'fa-users',
                      online: 'fa-circle text-green-500',
                      banned: 'fa-ban',
                      messages: 'fa-envelope',
                      system: 'fa-cog',
                    }[section]
                  } w-4`}></i>
                  <span>{sectionTitles[section]}</span>
                </button>
              ))}
            </nav>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center mb-4 px-3 py-2 bg-gray-50 rounded-md">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-user text-gray-600 text-sm"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {authenticatedUser?.fullName || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-150 flex items-center"
              >
                <i className="fas fa-sign-out-alt mr-2 w-4"></i>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{sectionTitles[currentSection]}</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý và giám sát hệ thống</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  realtimeStatus 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    realtimeStatus ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  {realtimeStatus ? 'Online' : 'Offline'}
                </div>
                <button 
                  onClick={() => loadSectionData(currentSection)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150 flex items-center"
                >
                  <i className="fas fa-sync-alt mr-2"></i>
                  Làm mới
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {alertList.length > 0 && (
              <div className="space-y-2 mb-6">
                {alertList.map(a => (
                  <div key={a.id} className={`p-4 rounded-md border flex justify-between items-center ${
                    a.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                    a.type === 'danger' ? 'bg-red-50 text-red-800 border-red-200' :
                    a.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                    'bg-blue-50 text-blue-800 border-blue-200'
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
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <i className="fas fa-users text-blue-600 text-lg"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-gray-900">{stats.totalUsers || 0}</h3>
                        <p className="text-sm text-gray-600">Tổng Users</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <i className="fas fa-circle text-green-600 text-lg"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-gray-900">{stats.onlineUsers || 0}</h3>
                        <p className="text-sm text-gray-600">Users Online</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <i className="fas fa-ban text-red-600 text-lg"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-gray-900">{stats.bannedUsers || 0}</h3>
                        <p className="text-sm text-gray-600">Users Bị Cấm</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <i className="fas fa-envelope text-purple-600 text-lg"></i>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-gray-900">{stats.totalMessages || 0}</h3>
                        <p className="text-sm text-gray-600">Tổng Tin nhắn</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentSection !== 'dashboard' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{sectionTitles[currentSection]}</h3>
                  <p className="text-sm text-gray-500 mt-1">Đang phát triển...</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">Chức năng này đang được phát triển.</p>
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