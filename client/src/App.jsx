import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import LoginModal from './components/LoginModal.jsx';

import DashboardView from './views/DashboardView.jsx';
import CasesView from './views/CasesView.jsx';
import InvestigationWorkspaceView from './views/InvestigationWorkspaceView.jsx';
import DepartmentView from './views/DepartmentView.jsx';
import AccessControlView from './views/AccessControlView.jsx';
import SecurityGuardianView from './views/SecurityGuardianView.jsx';
import AuditTrailView from './views/AuditTrailView.jsx';
import ReportsView from './views/ReportsView.jsx';
import ManagementOverviewView from './views/ManagementOverviewView.jsx';
import IntelligenceSearchView from './views/IntelligenceSearchView.jsx';
import Entity360View from './views/Entity360View.jsx';
import NetworkGraphView from './views/NetworkGraphView.jsx';
import WhyConnectedView from './views/WhyConnectedView.jsx';
import CrossCaseView from './views/CrossCaseView.jsx';
import TimelineView from './views/TimelineView.jsx';
import MapView from './views/MapView.jsx';
import BiometricSearchView from './views/BiometricSearchView.jsx';
import AIInvestigationView from './views/AIInvestigationView.jsx';
import AnomalyDetectionView from './views/AnomalyDetectionView.jsx';
import SettingsView from './views/SettingsView.jsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    id: 'OFFICER-001',
    name: 'Inspector Vikram Rathore',
    email: 'v.rathore@police.gov.in',
    role: 'Investigator',
    department: 'D001',
    departmentName: 'Cyber Crime Investigation Division',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    pin: '2618'
  });
  const [token, setToken] = useState('NETRISH_ACTIVE_SESSION');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');

  // Context passing
  const [selectedCaseId, setSelectedCaseId] = useState('C00228');
  const [selectedEntityId, setSelectedEntityId] = useState('P0732');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleLoginSuccess = (user, sessionToken) => {
    setCurrentUser(user);
    setToken(sessionToken);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setIsLoginOpen(true);
  };

  // Render current tab content
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
      case 'erp-overview':
        return (
          <DashboardView
            setTab={setCurrentTab}
            onSelectEntity={(id) => { setSelectedEntityId(id); setCurrentTab('intel-360'); }}
            onSelectCase={(id) => { setSelectedCaseId(id); setCurrentTab('erp-cases'); }}
          />
        );
      case 'erp-cases':
        return (
          <CasesView
            selectedCaseId={selectedCaseId}
            onSelectCase={setSelectedCaseId}
            onSelectEntity={(id) => { setSelectedEntityId(id); setCurrentTab('intel-360'); }}
            setTab={setCurrentTab}
          />
        );
      case 'erp-workspace':
        return (
          <InvestigationWorkspaceView
            currentCaseId={selectedCaseId}
            currentUser={currentUser}
            onSelectEntity={(id) => { setSelectedEntityId(id); setCurrentTab('intel-360'); }}
            setTab={setCurrentTab}
          />
        );
      case 'erp-department':
        return (
          <DepartmentView
            defaultDeptId={currentUser?.department || 'D001'}
            onSelectCase={(id) => { setSelectedCaseId(id); setCurrentTab('erp-cases'); }}
            setTab={setCurrentTab}
          />
        );
      case 'erp-access':
      case 'erp-temporary':
        return <AccessControlView currentUser={currentUser} />;
      case 'erp-security':
        return <SecurityGuardianView setTab={setCurrentTab} />;
      case 'erp-audit':
        return <AuditTrailView />;
      case 'erp-reports':
        return <ReportsView currentCaseId={selectedCaseId} currentUser={currentUser} />;
      case 'erp-management':
        return <ManagementOverviewView />;
      case 'intel-search':
        return (
          <IntelligenceSearchView
            onSelectEntity={(id) => { setSelectedEntityId(id); setCurrentTab('intel-360'); }}
            onSelectCase={(id) => { setSelectedCaseId(id); setCurrentTab('erp-cases'); }}
            setTab={setCurrentTab}
          />
        );
      case 'intel-360':
        return (
          <Entity360View
            entityId={selectedEntityId}
            onSelectEntity={setSelectedEntityId}
            onSelectCase={(id) => { setSelectedCaseId(id); setCurrentTab('erp-cases'); }}
            setTab={setCurrentTab}
          />
        );
      case 'intel-network':
        return (
          <NetworkGraphView
            initialCenterId={selectedEntityId}
            onSelectEntity={(id) => { setSelectedEntityId(id); setCurrentTab('intel-360'); }}
            onSelectCase={(id) => { setSelectedCaseId(id); setCurrentTab('erp-cases'); }}
          />
        );
      case 'intel-why':
        return (
          <WhyConnectedView
            defaultSource={selectedEntityId}
            defaultTarget="P0765"
            onSelectEntity={(id) => { setSelectedEntityId(id); setCurrentTab('intel-360'); }}
          />
        );
      case 'intel-cross':
        return (
          <CrossCaseView
            defaultCase1={selectedCaseId}
            defaultCase2="C00553"
            onSelectCase={(id) => { setSelectedCaseId(id); setCurrentTab('erp-cases'); }}
          />
        );
      case 'intel-timeline':
        return (
          <TimelineView
            defaultCaseId={selectedCaseId}
            defaultPersonId={selectedEntityId}
          />
        );
      case 'intel-map':
        return (
          <MapView
            onSelectCase={(id) => { setSelectedCaseId(id); setCurrentTab('erp-cases'); }}
          />
        );
      case 'intel-biometric':
        return (
          <BiometricSearchView
            onSelectEntity={(id) => { setSelectedEntityId(id); setCurrentTab('intel-360'); }}
            setTab={setCurrentTab}
          />
        );
      case 'intel-ai':
        return (
          <AIInvestigationView
            currentCaseId={selectedCaseId}
            currentUser={currentUser}
            setTab={setCurrentTab}
          />
        );
      case 'analytics-anomalies':
        return (
          <AnomalyDetectionView
            onSelectEntity={(id) => { setSelectedEntityId(id); setCurrentTab('intel-360'); }}
            onSelectCase={(id) => { setSelectedCaseId(id); setCurrentTab('erp-cases'); }}
            setTab={setCurrentTab}
          />
        );
      case 'settings':
        return (
          <SettingsView
            currentUser={currentUser}
            activeTheme={theme}
            toggleTheme={toggleTheme}
          />
        );
      default:
        return <DashboardView setTab={setCurrentTab} />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans`}>
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        activeTheme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setTab={setCurrentTab}
          pendingRequestsCount={1}
        />

        {/* Dynamic Main View Area */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {renderContent()}
        </main>
      </div>

      {/* Login & 2FA Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
