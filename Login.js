import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function Login({ setUser, isKeychain }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isEcencyLogin, setIsEcencyLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to home
  const from = location.state?.from || '/';

  // Handle direct login with username/password
  const handleDirectLogin = (e) => {
    e.preventDefault();
    if (!username) {
      setError('Please enter a username');
      return;
    }
    
    // For demonstration purposes, we'll just log the user in
    // In a real app, you would validate credentials with Hive
    localStorage.setItem('hivesocial_user', username);
    setUser(username);
    navigate(from);
  };

  const handleKeychainLogin = async () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }

    // Check if Hive Keychain is available
    if (!window.hive_keychain) {
      setError('Hive Keychain extension is not installed. Please install it and try again.');
      return;
    }

    try {
      const memo = `Login attempt for HiveSocial at ${new Date().toISOString()}`;
      
      window.hive_keychain.requestSignBuffer(
        username,
        memo,
        'Posting',
        (response) => {
          if (response.success) {
            // Save user to localStorage for persistence
            localStorage.setItem('hivesocial_user', username);
            setUser(username);
            
            // Redirect to the page they were trying to access or home
            navigate(from);
          } else {
            setError('Login failed: ' + response.message);
          }
        }
      );
    } catch (err) {
      setError('Failed to connect to Hive Keychain: ' + err.message);
      console.error('Keychain error:', err);
    }
  };

  const handleEcencyLogin = () => {
    setIsEcencyLogin(true);
    setError('');
  };

  // Redirect to Ecency when isEcencyLogin is true
  useEffect(() => {
    if (isEcencyLogin) {
      // Save the redirect path for after authentication
      localStorage.setItem('hivesocial_redirect', from);
      
      // Construct the callback URL
      const callbackUrl = `${window.location.origin}/ecency-callback`;
      
      // Redirect to Ecency auth page
      window.location.href = `https://ecency.com/hive-auth?redirect_url=${encodeURIComponent(callbackUrl)}`;
    }
  }, [isEcencyLogin, from]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Login to HiveSocial</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleDirectLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Hive Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter your Hive username"
          />
        </div>
        
        {!isKeychain && (
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Enter your password"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your password is never stored or transmitted to our servers
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          {isKeychain ? (
            <button
              type="button"
              onClick={handleKeychainLogin}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            >
              Login with Hive Keychain
            </button>
          ) : (
            <>
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
              >
                Login with Username/Password
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              
              <button
                type="button"
                onClick={handleEcencyLogin}
                className="w-full bg-[#3F72AF] hover:bg-[#2C5282] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out flex items-center justify-center"
              >
                <img 
                  src="https://ecency.com/favicon.ico" 
                  alt="Ecency" 
                  className="w-5 h-5 mr-2"
                />
                Login with Ecency
              </button>
            </>
          )}
        </div>
      </form>
      
      <p className="mt-4 text-center text-gray-600 text-sm">
        {isKeychain
          ? "Make sure you have Hive Keychain browser extension installed"
          : "Choose the login method that works best for you"}
      </p>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Don't have a Hive account?{' '}
          <a 
            href="https://signup.hive.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Create one here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login; 