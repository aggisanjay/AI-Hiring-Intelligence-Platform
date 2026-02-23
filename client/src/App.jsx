import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Pages
import LoginPage    from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Recruiter
import RecruiterLayout    from './components/layout/RecruiterLayout.jsx';
import RecruiterDashboard from './pages/recruiter/Dashboard.jsx';
import JobsPage           from './pages/recruiter/JobsPage.jsx';
import CandidatesPage     from './pages/recruiter/CandidatesPage.jsx';
import PipelinePage       from './pages/recruiter/PipelinePage.jsx';
import AnalyticsPage      from './pages/recruiter/AnalyticsPage.jsx';

// Candidate
import CandidateLayout    from './components/layout/CandidateLayout.jsx';
import CandidateDashboard from './pages/candidate/Dashboard.jsx';
import BrowseJobsPage     from './pages/candidate/BrowseJobsPage.jsx';
import ApplicationsPage   from './pages/candidate/ApplicationsPage.jsx';
import InterviewPage      from './pages/candidate/InterviewPage.jsx';
import ProfilePage        from './pages/candidate/ProfilePage.jsx';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return user.role === 'recruiter'
    ? <Navigate to="/recruiter/dashboard" replace />
    : <Navigate to="/candidate/dashboard" replace />;
};

const PageLoader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#06090f' }}>
    <div style={{ textAlign:'center' }}>
      <div style={{ width:40, height:40, border:'3px solid #1e293b', borderTopColor:'#3b82f6', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
      <p style={{ color:'#475569', fontFamily:'DM Sans, sans-serif', fontSize:14 }}>Loading HireIQ...</p>
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"        element={<RootRedirect />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Recruiter */}
      <Route path="/recruiter" element={
        <ProtectedRoute role="recruiter">
          <RecruiterLayout />
        </ProtectedRoute>
      }>
        <Route index                    element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"         element={<RecruiterDashboard />} />
        <Route path="jobs"              element={<JobsPage />} />
        <Route path="candidates"        element={<CandidatesPage />} />
        <Route path="pipeline/:jobId"   element={<PipelinePage />} />
        <Route path="analytics"         element={<AnalyticsPage />} />
      </Route>

      {/* Candidate */}
      <Route path="/candidate" element={
        <ProtectedRoute role="candidate">
          <CandidateLayout />
        </ProtectedRoute>
      }>
        <Route index                    element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"         element={<CandidateDashboard />} />
        <Route path="jobs"              element={<BrowseJobsPage />} />
        <Route path="applications"      element={<ApplicationsPage />} />
        <Route path="interview"         element={<InterviewPage />} />
        <Route path="profile"           element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111827',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.07)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 14,
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#111827' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#111827' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}