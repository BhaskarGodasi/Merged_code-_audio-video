import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import ToastContainer from './components/common/ToastContainer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SendAds from './pages/SendAds';
import AddToMultipleDevices from './pages/AddToMultipleDevices';
import LiveRelay from './pages/LiveRelay';
import Campaigns from './pages/Campaigns';
import CampaignDetails from './pages/CampaignDetails';
import Devices from './pages/Devices';
import Jingles from './pages/Jingles';
import Logs from './pages/Logs';
import Brands from './pages/Brands';
import BrandDetails from './pages/BrandDetails';
import Companies from './pages/Companies';
import Users from './pages/Users';
import './App.css';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleNavLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 960) {
      setSidebarOpen(false);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onLinkClick={handleNavLinkClick} onToggle={handleSidebarToggle} />
      <div className="app-main">
        <Header onToggleSidebar={handleSidebarToggle} />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/send-ads" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><SendAds /></ProtectedRoute>} />
            <Route path="/add-to-multiple-devices" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AddToMultipleDevices /></ProtectedRoute>} />
            <Route path="/live-relay" element={<ProtectedRoute><LiveRelay /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Campaigns /></ProtectedRoute>} />
            <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignDetails /></ProtectedRoute>} />
            <Route path="/brands" element={<ProtectedRoute><Brands /></ProtectedRoute>} />
            <Route path="/brands/:id" element={<ProtectedRoute><BrandDetails /></ProtectedRoute>} />
            <Route path="/companies" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Companies /></ProtectedRoute>} />
            <Route path="/clients" element={<Navigate to="/brands" replace />} />
            <Route path="/clients/:id" element={<Navigate to="/brands/:id" replace />} />
            <Route path="/devices" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Devices /></ProtectedRoute>} />
            <Route path="/jingles" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><Jingles /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['superadmin']}><Users /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
