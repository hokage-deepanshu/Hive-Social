import React, { useState, useEffect, useContext } from 'react';
import { HiveContext } from '../App';
import { followUser, unfollowUser, checkIfFollowing } from '../utils/SocialUtils';

const FollowButton = ({ username }) => {
  const { client, user } = useContext(HiveContext);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Check if the current user is following the profile user
  useEffect(() => {
    if (user && username && user.name !== username) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [user, username]);

  const checkFollowStatus = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await checkIfFollowing(client, user.name, username);
      if (result.success) {
        setIsFollowing(result.isFollowing);
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      alert('Please login to follow users');
      return;
    }
    
    setProcessing(true);
    setError('');
    
    try {
      const result = isFollowing
        ? await unfollowUser(client, user.name, username)
        : await followUser(client, user.name, username);
      
      if (result.success) {
        setIsFollowing(!isFollowing);
      } else {
        setError(result.error || `Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      }
    } catch (err) {
      setError(`Error ${isFollowing ? 'unfollowing' : 'following'} user: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Don't show follow button on own profile or if not logged in
  if (!user || user.name === username) {
    return null;
  }

  return (
    <div>
      <button
        onClick={handleFollowToggle}
        disabled={loading || processing}
        className={`px-4 py-2 rounded-md font-medium ${
          isFollowing
            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } transition-colors disabled:opacity-50`}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading
          </span>
        ) : processing ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isFollowing ? 'Unfollowing...' : 'Following...'}
          </span>
        ) : (
          <span>
            {isFollowing ? 'Unfollow' : 'Follow'}
          </span>
        )}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
    </div>
  );
};

export default FollowButton; 