import { Route, Switch } from 'wouter';
import { Navbar, ProtectedRoute } from './components';
import { HomePage, DashboardPage, ProfilePage } from './pages';
import { useInitializeApiClient } from './lib/api';
import { useUserSync } from './hooks';

function App() {
  // Initialize API client with Clerk auth token
  useInitializeApiClient();

  // Auto-sync user to database when they sign in
  useUserSync();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <Switch>
        {/* Public Route */}
        <Route path="/" component={HomePage} />

        {/* Protected Routes */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        </Route>

        <Route path="/profile">
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        </Route>

        {/* 404 - Not Found */}
        <Route>
          <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-4xl">🔍</span>
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                404
              </h1>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                The page you're looking for doesn't exist or has been moved.
              </p>
              <a
                href="/"
                className="btn-primary inline-block"
              >
                Return Home
              </a>
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

export default App;
