import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiveContext } from '../App';
import { Avatar, getProfileImageUrl, ImageWithFallback } from '../utils/ImageUtils';
import { uploadMedia } from '../utils/UploadUtils';
import FollowButton from './FollowButton';
import Post from './Post';

const Profile = () => {
  const { client, user } = useContext(HiveContext);
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const fileInputRef = useRef(null);

  // Fetch profile and posts when username changes
  useEffect(() => {
    if (username) {
      fetchProfileAndPosts();
    }
  }, [username, client]);

  // Fetch profile and posts data
  const fetchProfileAndPosts = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch account information
      const accounts = await client.database.getAccounts([username]);
      if (accounts.length === 0) {
        setError('User not found');
        setLoading(false);
        return;
      }

      const account = accounts[0];
      let metadata = {};
      try {
        metadata = JSON.parse(account.json_metadata || '{}');
      } catch (e) {
        console.error('Failed to parse metadata');
      }

      setProfile({
        name: account.name,
        about: metadata.profile?.about || '',
        website: metadata.profile?.website || '',
        location: metadata.profile?.location || '',
        created: account.created,
        postCount: account.post_count,
        followingCount: account.following_count || 0,
        followerCount: account.follower_count || 0,
        reputation: account.reputation
      });

      // Fetch user's posts
      const query = {
        tag: username,
        limit: 10
      };
      
      const userPosts = await client.database.getDiscussions('blog', query);
      setPosts(userPosts);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    try {
      const postDate = new Date(date + 'Z');
      return postDate.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return date;
    }
  };

  // Handle media upload
  const handleMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingMedia(true);
    setUploadError('');
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadMedia(file);
        if (result.success) {
          return {
            url: result.url,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            name: file.name
          };
        } else {
          throw new Error(result.error || `Failed to upload ${file.name}`);
        }
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      setUploadedMedia(prev => [...prev, ...uploadResults]);
    } catch (err) {
      setUploadError('Error uploading media: ' + err.message);
    } finally {
      setUploadingMedia(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded media
  const removeMedia = (index) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Render loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
            <div className="flex-grow space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-50 p-4 rounded">
                <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      {profile && (
        <>
          {/* Profile header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src={getProfileImageUrl(profile.name)}
                  fallbackSrc={`https://ui-avatars.com/api/?name=${profile.name}&background=0D8ABC&color=fff&size=128`}
                  alt={profile.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              </div>
              <div className="flex-grow text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h1 className="text-3xl font-bold">@{profile.name}</h1>
                  <div className="mt-2 sm:mt-0">
                    <FollowButton username={profile.name} />
                  </div>
                </div>
                <div className="text-gray-600 mt-1">
                  Joined {formatDate(profile.created)}
                </div>
                {profile.about && (
                  <p className="text-gray-700 mt-4">{profile.about}</p>
                )}
                {profile.location && (
                  <div className="text-gray-600 mt-2">
                    <span className="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </span>
                  </div>
                )}
                {profile.website && (
                  <div className="text-gray-600 mt-1">
                    <a 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:underline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-2xl font-bold">{profile.postCount || 0}</div>
                <div className="text-gray-600">Posts</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-2xl font-bold">{profile.followerCount || 0}</div>
                <div className="text-gray-600">Followers</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-2xl font-bold">{profile.followingCount || 0}</div>
                <div className="text-gray-600">Following</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  activeTab === 'posts'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab('media')}
                className={`flex-1 py-4 px-6 text-center font-medium ${
                  activeTab === 'media'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Media
              </button>
              {user && user.name === username && (
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-4 px-6 text-center font-medium ${
                    activeTab === 'upload'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upload
                </button>
              )}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {/* Posts tab */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <Post 
                        key={`${post.author}-${post.permlink}`} 
                        post={post} 
                      />
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No posts yet
                    </div>
                  )}
                </div>
              )}

              {/* Media tab */}
              {activeTab === 'media' && (
                <div>
                  {posts.some(post => {
                    try {
                      const metadata = JSON.parse(post.json_metadata || '{}');
                      return metadata.image && metadata.image.length > 0;
                    } catch (e) {
                      return false;
                    }
                  }) ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {posts.map(post => {
                        try {
                          const metadata = JSON.parse(post.json_metadata || '{}');
                          if (metadata.image && metadata.image.length > 0) {
                            return metadata.image.map((img, index) => (
                              <div key={`${post.permlink}-${index}`} className="aspect-square overflow-hidden rounded-lg">
                                <img 
                                  src={img} 
                                  alt={post.title} 
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ));
                          }
                          return null;
                        } catch (e) {
                          return null;
                        }
                      }).filter(Boolean).flat()}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No media found
                    </div>
                  )}
                </div>
              )}

              {/* Upload tab */}
              {activeTab === 'upload' && user && user.name === username && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Upload Media</h3>
                    <p className="text-gray-600 mb-4">
                      Upload images or videos to share on your profile
                    </p>
                    <div className="flex items-center space-x-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                        className="hidden"
                        multiple
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingMedia}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {uploadingMedia ? 'Uploading...' : 'Select Files'}
                      </button>
                      <span className="text-gray-500 text-sm">
                        Supported formats: JPG, PNG, GIF, MP4
                      </span>
                    </div>
                    {uploadError && (
                      <div className="text-red-500 mt-2">
                        {uploadError}
                      </div>
                    )}
                  </div>

                  {/* Uploaded media preview */}
                  {uploadedMedia.length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium mb-2">Uploaded Media</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {uploadedMedia.map((media, index) => (
                          <div key={index} className="relative group">
                            {media.type === 'image' ? (
                              <img
                                src={media.url}
                                alt={media.name}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                            ) : (
                              <video
                                src={media.url}
                                className="w-full h-48 object-cover rounded-lg"
                                controls
                              />
                            )}
                            <button
                              onClick={() => removeMedia(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Profile; 