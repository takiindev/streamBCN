import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Stream from './pages/Stream';
import Dashboard from './pages/Dashboard';
import NewDashboard from './pages/NewDashboard';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Stream />} />
          <Route path="/stream" element={<Stream />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/newdashboard" element={<NewDashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
