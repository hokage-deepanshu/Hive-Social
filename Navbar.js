import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiveContext } from '../App';
import { Logo } from '../utils/ImageUtils';

const Navbar = () => {
  const { user, setUser, isKeychain } = useContext(HiveContext);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close menu when location changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('hivesocial_user');
    setMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className={`bg-white sticky top-0 z-30 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Logo size="md" className="mr-2" />
              <span className="font-semibold text-gray-800 text-lg">HiveSocial</span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-2">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                Home
              </Link>
              <Link to="/create" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/create' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                Create Post
              </Link>
              <Link to="/chat" className={`px-3 py-2 rounded-md text-sm font-medium ${location.pathname === '/chat' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                Chat
              </Link>
            </div>
          </div>
          
          {/* Right side buttons */}
          <div className="flex items-center">
            {/* User menu */}
            {user ? (
              <div className="relative ml-3">
                <button
                  onClick={toggleMenu}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 text-white">
                    {user.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                {/* Dropdown menu */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link to={`/profile/${user}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profile
                      </Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Sign In with {isKeychain ? 'Keychain' : 'Ecency'}
              </button>
            )}
            
            {/* Mobile menu button */}
            <div className="flex md:hidden ml-2">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${menuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${menuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`${menuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
            <Link to="/" className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
              Home
            </Link>
            <Link to="/create" className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/create' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
              Create Post
            </Link>
            <Link to="/chat" className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/chat' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
              Chat
            </Link>
            {user ? (
              <>
                <Link to={`/profile/${user}`} className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname.startsWith('/profile') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                  Profile
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50">
                  Sign out
                </button>
              </>
            ) : (
              <button 
                onClick={handleLogin}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
              >
                Sign In with {isKeychain ? 'Keychain' : 'Ecency'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 