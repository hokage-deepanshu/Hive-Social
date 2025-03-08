import React, { useState, useEffect, useContext, useCallback } from 'react';
import { HiveContext } from '../App';
import Post from './Post';

// Categories for filtering posts
const CATEGORIES = ['trending', 'hot', 'created', 'blog', 'promoted'];

// Sample data for fallback when API fails
const SAMPLE_POSTS = [
  {
    author: 'hivebuzz',
    permlink: 'welcome-to-hive',
    title: 'Welcome to Hive Social',
    body: 'This is a sample post that appears when the Hive API connection is not working properly. The actual content will load when the connection is established.',
    created: new Date().toISOString().replace('Z', ''),
    net_votes: 0,
    children: 0,
    pending_payout_value: '0.000 HBD',
    json_metadata: JSON.stringify({ tags: ['hive', 'social', 'welcome'] })
  },
  {
    author: 'hivesocial',
    permlink: 'getting-started',
    title: 'Getting Started with Hive Social',
    body: 'Learn how to use Hive Social to connect with others on the Hive blockchain. This is a placeholder post while we try to connect to the Hive API.',
    created: new Date().toISOString().replace('Z', ''),
    net_votes: 0,
    children: 0,
    pending_payout_value: '0.000 HBD',
    json_metadata: JSON.stringify({ tags: ['tutorial', 'hive', 'social'] })
  }
];

const Home = () => {
  const { client } = useContext(HiveContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('trending');
  const [hasMore, setHasMore] = useState(true);
  const [lastPost, setLastPost] = useState(null);
  const [usingSampleData, setUsingSampleData] = useState(false);

  // Fetch posts with proper error handling and caching
  const fetchPosts = useCallback(async (reset = false) => {
    if (!client) {
      console.error('No Hive client available');
      setError('Hive client not initialized');
      setLoading(false);
      // Use sample data as fallback
      setPosts(SAMPLE_POSTS);
      setUsingSampleData(true);
      return;
    }

    try {
      setLoading(true);
      
      // If reset, clear existing posts
      if (reset) {
        setPosts([]);
        setLastPost(null);
      }

      // Prepare query parameters
      const query = {
        limit: 10,
        tag: '',
      };

      console.log(`Fetching ${category} posts...`, query);
      
      // Fetch posts from Hive
      const result = await client.database.getDiscussions(category, query);
      console.log('Fetched posts:', result);

      // Process results
      if (Array.isArray(result) && result.length > 0) {
        setPosts(result);
        setUsingSampleData(false);
      } else {
        console.log('No posts returned, trying another category');
        // Try another category if current one returns no results
        if (category === 'trending') {
          setCategory('hot');
        } else if (category === 'hot') {
          setCategory('created');
        } else {
          // If all else fails, use sample data
          setPosts(SAMPLE_POSTS);
          setUsingSampleData(true);
          setError('Could not fetch posts from Hive. Showing sample content.');
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(`Failed to fetch posts: ${err.message || 'Unknown error'}`);
      
      // Use sample data as fallback
      setPosts(SAMPLE_POSTS);
      setUsingSampleData(true);
    } finally {
      setLoading(false);
    }
  }, [client, category]);

  // Initial load
  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts, category]);

  // Handle category change
  const handleCategoryChange = (newCategory) => {
    if (newCategory === category) return;
    setCategory(newCategory);
    setHasMore(true);
    // fetchPosts will be called by the useEffect
  };

  // Render loading skeletons
  const renderSkeletons = () => (
    <>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 ml-3"></div>
          </div>
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
              category === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={usingSampleData}
          >
            {cat}
          </button>
        ))}
      </div>

      <h1 className="text-3xl font-bold mb-8 capitalize">
        {usingSampleData ? 'Sample Posts' : `${category} Posts`}
      </h1>

      {/* Error message */}
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          {error}
          <button 
            onClick={() => fetchPosts(true)} 
            className="ml-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Posts list */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <Post 
              key={`${post.author}-${post.permlink}-${index}`}
              post={post}
              priority={index < 2}
            />
          ))
        ) : !loading ? (
          <div className="text-center text-gray-600 py-12">
            No posts available in this category
          </div>
        ) : null}

        {/* Loading indicators */}
        {loading && renderSkeletons()}

        {/* Sample data notice */}
        {usingSampleData && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mt-6">
            <p className="font-bold">Note</p>
            <p>Showing sample content because we couldn't connect to the Hive blockchain. Some features may be limited.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 