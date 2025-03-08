import React, { useState, useEffect, Suspense, lazy, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Client } from '@hiveio/dhive';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Create context for global state
export const HiveContext = createContext();

// Lazy load components with better naming for chunks
const Home = lazy(() => import(/* webpackChunkName: "home" */ './components/Home'));
const Login = lazy(() => import(/* webpackChunkName: "login" */ './components/Login'));
const Profile = lazy(() => import(/* webpackChunkName: "profile" */ './components/Profile'));
const CreatePost = lazy(() => import(/* webpackChunkName: "create-post" */ './components/CreatePost'));
const NotFound = lazy(() => import(/* webpackChunkName: "not-found" */ './components/NotFound'));
const Chat = lazy(() => import(/* webpackChunkName: "chat" */ './components/Chat'));
const PostView = lazy(() => import(/* webpackChunkName: "post-view" */ './components/PostView'));

// Hive nodes with health monitoring
const HIVE_NODES = [
  'https://api.hive.blog',
  'https://api.hivekings.com',
  'https://anyx.io',
  'https://api.openhive.network'
];

// Initialize Hive client with simpler configuration
const createHiveClient = () => {
  return new Client(HIVE_NODES);
};

// Loading fallback component with better styling
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <div className="text-xl text-gray-600">Loading...</div>
    </div>
  </div>
);

// Add a new component to handle Ecency auth callback
const EcencyCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { setUser } = useContext(HiveContext);

  useEffect(() => {
    // Parse the URL parameters
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username');
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (username && accessToken) {
      // Store the auth data
      localStorage.setItem('hivesocial_user', username);
      localStorage.setItem('hivesocial_token', accessToken);
      localStorage.setItem('hivesocial_token_expiry', Date.now() + (expiresIn * 1000));
      
      // Update the user context
      setUser(username);
      
      // Redirect to home or the original destination
      const redirectTo = localStorage.getItem('hivesocial_redirect') || '/';
      localStorage.removeItem('hivesocial_redirect'); // Clean up
      navigate(redirectTo);
    } else {
      setError('Authentication failed. Please try again.');
    }
  }, [navigate, setUser]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Authentication Error</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <div className="text-xl text-gray-600 mb-2">
          Completing authentication...
        </div>
      </div>
    </div>
  );
};

function App() {
  const [client, setClient] = useState(null);
  const [user, setUser] = useState(localStorage.getItem('hivesocial_user') || null);
  const [isKeychain, setIsKeychain] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [clientReady, setClientReady] = useState(false);

  // Initialize client and check Keychain with retry logic
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      
      // Check if Hive Keychain is available
      if (window.hive_keychain) {
        setIsKeychain(true);
      }

      try {
        // Create client
        const newClient = createHiveClient();
        console.log('Created Hive client');
        
        // Test connection with a simple API call
        try {
          await newClient.database.getDynamicGlobalProperties();
          console.log('Successfully connected to Hive');
          setClient(newClient);
          setClientReady(true);
          setNetworkError(null);
        } catch (err) {
          console.error('Error connecting to Hive API:', err);
          
          // If we've tried less than 3 times, retry
          if (connectionAttempts < 3) {
            console.log(`Retrying connection (attempt ${connectionAttempts + 1}/3)...`);
            setConnectionAttempts(prev => prev + 1);
            // We'll continue without a working client
            setClient(newClient);
            setClientReady(true);
          } else {
            setNetworkError('Could not connect to Hive blockchain after multiple attempts. Proceeding with limited functionality.');
            // Still set client ready to proceed with app
            setClient(newClient);
            setClientReady(true);
          }
        }
      } catch (err) {
        console.error('Error creating Hive client:', err);
        setNetworkError('Failed to initialize Hive client. Proceeding with limited functionality.');
        // Create a basic client anyway to allow the app to load
        setClient(createHiveClient());
        setClientReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    // Preload critical components
    const preloadComponents = () => {
      import('./components/Home');
      import('./components/Post');
    };
    preloadComponents();

    // Retry connection if needed
    if (connectionAttempts > 0 && connectionAttempts < 3 && !clientReady) {
      const timer = setTimeout(() => {
        initializeApp();
      }, 2000); // Wait 2 seconds between retries
      
      return () => clearTimeout(timer);
    }
  }, [connectionAttempts, clientReady]);

  // Show loading state while initializing
  if (isLoading && connectionAttempts < 2) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600 mb-2">
            Connecting to Hive Blockchain
          </div>
          <div className="text-sm text-gray-500">
            This might take a few seconds...
          </div>
        </div>
      </div>
    );
  }

  return (
    <HiveContext.Provider value={{ 
      client, 
      user, 
      setUser, 
      isKeychain
    }}>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            {isLoading ? (
              <LoadingFallback />
            ) : networkError ? (
              <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Connection Error</h2>
                  <p className="mb-4 text-gray-600">
                    {networkError}
                  </p>
                  <button 
                    onClick={() => {
                      setConnectionAttempts(0);
                      setClientReady(false);
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            ) : (
              <Router>
                <Navbar />
                <div className="container mx-auto px-4 py-4">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login setUser={setUser} isKeychain={isKeychain} />} />
                    <Route path="/ecency-callback" element={<EcencyCallback />} />
                    <Route path="/profile/:username" element={<Profile />} />
                    <Route path="/create" element={<CreatePost />} />
                    <Route path="/chat" element={user ? <Chat /> : <Navigate to="/login" state={{ from: '/chat' }} />} />
                    <Route path="/@:author/:permlink" element={<PostView />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </Router>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </HiveContext.Provider>
  );
}

export default App; 