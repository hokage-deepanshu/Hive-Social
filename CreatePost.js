import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiveContext } from '../App';
import { getPostImageUrl } from '../utils/ImageUtils';
import { Client, PrivateKey } from '@hiveio/dhive';

const CreatePost = () => {
  const { user, client, isKeychain } = useContext(HiveContext);
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [postingMethod, setPostingMethod] = useState(isKeychain ? 'keychain' : 'direct');
  const [debugInfo, setDebugInfo] = useState('');
  const [localClient, setLocalClient] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  
  // Initialize a local client as fallback
  useEffect(() => {
    // Create a local client if the context client is not available
    if (!client) {
      console.log('Creating local Hive client as fallback');
      const nodes = [
        'https://api.hive.blog',
        'https://api.hivekings.com',
        'https://anyx.io',
        'https://api.openhive.network'
      ];
      setLocalClient(new Client(nodes));
    }
  }, [client]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/create' } });
    }
  }, [user, navigate]);
  
  // Debug function to check client and user status
  const checkStatus = () => {
    const status = {
      user: user || 'Not logged in',
      clientFromContext: client ? 'Available' : 'Not available',
      localClient: localClient ? 'Available' : 'Not available',
      hiveKeychain: window.hive_keychain ? 'Installed' : 'Not installed',
      postingMethod: postingMethod
    };
    
    setDebugInfo(JSON.stringify(status, null, 2));
  };
  
  // Add a function to reset the form state
  const resetFormState = () => {
    setIsSubmitting(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };
  
  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setDebugInfo('');
    
    // Check if user is logged in
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    if (!body.trim()) {
      setError('Please enter content for your post');
      return;
    }
    
    if (!tags.trim()) {
      setError('Please enter at least one tag');
      return;
    }
    
    // Helper function to generate a unique permlink
    const generatePermlink = () => {
      const now = new Date();
      const timeString = now.toISOString().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const randomString = Math.random().toString(36).substring(2, 8);
      const basePermlink = title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      return `${basePermlink}-${timeString.substring(0, 8)}-${randomString}`;
    };
    
    // Parse tags
    const tagArray = tags
      .toLowerCase()
      .split(' ')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    if (tagArray.length === 0) {
      setError('Please enter at least one valid tag');
      return;
    }
    
    // Prepare post metadata
    const permlink = generatePermlink();
    
    const jsonMetadata = {
      tags: tagArray,
      app: 'hivesocial/1.0.0',
      format: 'markdown',
      image: imageUrl ? [imageUrl] : []
    };
    
    setIsSubmitting(true);
    
    try {
      if (postingMethod === 'keychain' && window.hive_keychain) {
        console.log('Attempting to post with Hive Keychain');
        // Use Hive Keychain to broadcast the post
        window.hive_keychain.requestPost(
          user,
          permlink,
          tagArray[0] || 'hive-174695', // Use first tag or default community
          title,
          body,
          JSON.stringify(jsonMetadata),
          'posting', // Use posting authority
          (response) => {
            setIsSubmitting(false);
            
            if (response.success) {
              console.log('Post successful with Keychain:', response);
              // Show success message
              setSuccessMessage('Post published successfully!');
              
              // Clear form after successful post
              setTimeout(() => {
                setTitle('');
                setBody('');
                setTags('');
                setImageUrl('');
                setSuccessMessage('');
                
                // Redirect to the new post
                navigate(`/@${user}/${permlink}`);
              }, 2000);
            } else {
              console.error('Keychain post failed:', response);
              setError(`Failed to publish post: ${response.message || 'Unknown error'}`);
              setDebugInfo(JSON.stringify(response, null, 2));
            }
          }
        );
      } else if (postingMethod === 'direct') {
        // Fallback for non-Keychain users using direct API
        try {
          const activeClient = client || localClient;
          
          if (!activeClient) {
            setError('Hive client not initialized. Please refresh the page.');
            setIsSubmitting(false);
            return;
          }
          
          console.log('Attempting to post with direct API');
          
          // For direct API posting, we need the private posting key
          const postingKeyString = prompt('Please enter your Hive posting private key to publish this post:');
          
          if (!postingKeyString) {
            setError('Posting key is required to publish a post.');
            setIsSubmitting(false);
            return;
          }
          
          // Convert the string key to a PrivateKey object
          let postingKey;
          try {
            postingKey = PrivateKey.from(postingKeyString);
            console.log('Private key created successfully');
          } catch (keyError) {
            console.error('Invalid private key format:', keyError);
            setError('Invalid private key format. Please make sure you are using the correct private posting key.');
            setIsSubmitting(false);
            return;
          }
          
          // Create the post operation
          const operations = [
            ['comment', {
              parent_author: '',
              parent_permlink: tagArray[0] || 'hive-174695',
              author: user,
              permlink: permlink,
              title: title,
              body: body,
              json_metadata: JSON.stringify(jsonMetadata)
            }]
          ];
          
          console.log('Broadcasting operation:', operations);
          
          // Broadcast the transaction
          const result = await activeClient.broadcast.sendOperations(operations, postingKey);
          
          console.log('Post successful with direct API:', result);
          
          // Show success message
          setSuccessMessage('Post published successfully!');
          
          // Clear form after successful post
          setTimeout(() => {
            setTitle('');
            setBody('');
            setTags('');
            setImageUrl('');
            setSuccessMessage('');
            
            // Redirect to the new post
            navigate(`/@${user}/${permlink}`);
          }, 2000);
        } catch (err) {
          console.error('Error creating post with direct API:', err);
          setError(`Failed to publish post: ${err.message || 'Unknown error'}`);
          setDebugInfo(JSON.stringify({
            error: err.message,
            stack: err.stack,
            name: err.name
          }, null, 2));
          setIsSubmitting(false);
        }
      } else {
        setError('No posting method available. Please install Hive Keychain or use direct posting.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(`Failed to publish post: ${err.message || 'Unknown error'}`);
      setDebugInfo(JSON.stringify({
        error: err.message,
        stack: err.stack,
        name: err.name
      }, null, 2));
      setIsSubmitting(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    setUploadingImage(true);
    setError('');
    setDebugInfo('');
    
    try {
      // Using a more reliable method - base64 encoding the image
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const base64Image = event.target.result;
          
          // Set the image URL directly from the base64 data
          setImageUrl(base64Image);
          
          // Add image markdown to body
          const imageMarkdown = `\n![${file.name}](${base64Image})\n`;
          setBody(prevBody => prevBody + imageMarkdown);
          
          setUploadingImage(false);
        } catch (err) {
          console.error('Error processing image:', err);
          setError('Failed to process image: ' + (err.message || 'Unknown error'));
          setUploadingImage(false);
          setDebugInfo(JSON.stringify({
            error: err.message,
            stack: err.stack,
            name: err.name
          }, null, 2));
        }
      };
      
      reader.onerror = (err) => {
        console.error('Error reading file:', err);
        setError('Failed to read image file');
        setUploadingImage(false);
      };
      
      // Read the file as a data URL (base64)
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image: ' + (err.message || 'Unknown error'));
      setUploadingImage(false);
      setDebugInfo(JSON.stringify({
        error: err.message,
        stack: err.stack,
        name: err.name
      }, null, 2));
    }
  };
  
  // Simple post method for testing
  const handleSimplePost = async () => {
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setDebugInfo('');
    
    try {
      const activeClient = client || localClient;
      
      if (!activeClient) {
        setError('Hive client not initialized. Please refresh the page.');
        setIsSubmitting(false);
        return;
      }
      
      // For direct API posting, we need the private posting key
      const postingKeyString = prompt('Please enter your Hive posting private key for this test post:');
      
      if (!postingKeyString) {
        setError('Posting key is required for this test.');
        setIsSubmitting(false);
        return;
      }
      
      // Convert the string key to a PrivateKey object
      let postingKey;
      try {
        postingKey = PrivateKey.from(postingKeyString);
        console.log('Private key created successfully for test post');
      } catch (keyError) {
        console.error('Invalid private key format:', keyError);
        setError('Invalid private key format. Please make sure you are using the correct private posting key.');
        setIsSubmitting(false);
        return;
      }
      
      // Generate a simple permlink
      const testPermlink = `test-post-${Date.now()}`;
      
      // Create a simple post operation
      const operations = [
        ['comment', {
          parent_author: '',
          parent_permlink: 'test',
          author: user,
          permlink: testPermlink,
          title: 'Test Post',
          body: 'This is a test post from HiveSocial.',
          json_metadata: JSON.stringify({
            tags: ['test'],
            app: 'hivesocial/1.0.0'
          })
        }]
      ];
      
      console.log('Test post operations:', JSON.stringify(operations));
      console.log('Using key:', postingKey ? 'Valid key object' : 'Invalid key');
      
      try {
        // Broadcast the transaction
        const result = await activeClient.broadcast.sendOperations(operations, postingKey);
        
        console.log('Test post successful:', result);
        setSuccessMessage('Test post published successfully!');
        setDebugInfo(JSON.stringify(result, null, 2));
      } catch (broadcastErr) {
        console.error('Broadcast error:', broadcastErr);
        setError(`Failed to broadcast: ${broadcastErr.message || 'Unknown error'}`);
        setDebugInfo(JSON.stringify({
          error: broadcastErr.message,
          data: broadcastErr.data,
          name: broadcastErr.name
        }, null, 2));
      }
    } catch (err) {
      console.error('Error creating test post:', err);
      setError(`Failed to publish test post: ${err.message || 'Unknown error'}`);
      setDebugInfo(JSON.stringify({
        error: err.message,
        stack: err.stack,
        name: err.name
      }, null, 2));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update the handleDirectPost function
  const handleDirectPost = async () => {
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    if (!body.trim()) {
      setError('Please enter content for your post');
      return;
    }
    
    // Reset any existing timeouts
    resetFormState();
    
    setIsSubmitting(true);
    setError('');
    setDebugInfo('');
    
    // Set a timeout to reset the submitting state if it takes too long
    const timeout = setTimeout(() => {
      setIsSubmitting(false);
      setError('Posting timed out. Please try again.');
      console.log('Posting timed out after 30 seconds');
    }, 30000); // 30 second timeout
    
    setTimeoutId(timeout);
    
    try {
      // Create a new client directly
      const directClient = new Client(['https://api.hive.blog', 'https://api.openhive.network']);
      
      // For direct API posting, we need the private posting key
      const postingKeyString = prompt('Please enter your Hive posting private key to publish this post:');
      
      if (!postingKeyString) {
        setError('Posting key is required to publish a post.');
        resetFormState();
        return;
      }
      
      // Convert the string key to a PrivateKey object
      let postingKey;
      try {
        postingKey = PrivateKey.from(postingKeyString);
      } catch (keyError) {
        setError('Invalid private key format. Please make sure you are using the correct private posting key.');
        resetFormState();
        return;
      }
      
      // Generate a simple permlink
      const simplePermlink = `post-${Date.now()}`;
      
      // Create a simple post operation
      const operations = [
        ['comment', {
          parent_author: '',
          parent_permlink: 'hive-174695',
          author: user,
          permlink: simplePermlink,
          title: title,
          body: body,
          json_metadata: JSON.stringify({
            tags: ['hive-174695', 'hivesocial'],
            app: 'hivesocial/1.0.0',
            format: 'markdown',
            image: imageUrl ? [imageUrl] : []
          })
        }]
      ];
      
      console.log('Attempting to broadcast with operations:', JSON.stringify(operations));
      
      // Broadcast the transaction
      const result = await directClient.broadcast.sendOperations(operations, postingKey);
      
      console.log('Post successful with direct method:', result);
      
      // Clear the timeout since we succeeded
      clearTimeout(timeout);
      setTimeoutId(null);
      
      setSuccessMessage('Post published successfully!');
      setIsSubmitting(false);
      
      // Clear form after successful post
      setTimeout(() => {
        setTitle('');
        setBody('');
        setTags('');
        setImageUrl('');
        setSuccessMessage('');
        
        // Redirect to the home page
        navigate('/');
      }, 2000);
      
    } catch (err) {
      // Clear the timeout since we got an error
      clearTimeout(timeout);
      setTimeoutId(null);
      
      console.error('Error creating post with direct method:', err);
      setError(`Failed to publish post: ${err.message || 'Unknown error'}`);
      setDebugInfo(JSON.stringify({
        error: err.message,
        stack: err.stack,
        name: err.name,
        data: err.data
      }, null, 2));
      setIsSubmitting(false);
    }
  };
  
  // Add a force reset button to the UI
  const forceReset = () => {
    resetFormState();
    setError('Form state has been reset.');
  };
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Debug information */}
      {debugInfo && (
        <div className="bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded mb-4 overflow-auto">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          <pre className="text-xs">{debugInfo}</pre>
        </div>
      )}
      
      {/* Debug buttons */}
      <div className="mb-4 flex space-x-2">
        <button
          type="button"
          onClick={checkStatus}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-2 rounded text-sm"
        >
          Check Status
        </button>
        
        <button
          type="button"
          onClick={handleSimplePost}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-2 rounded text-sm"
        >
          Create Test Post
        </button>
        
        <button
          type="button"
          onClick={forceReset}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
        >
          Reset Form State
        </button>
      </div>
      
      {/* Posting method selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Posting Method</h3>
        <div className="flex space-x-4">
          {window.hive_keychain && (
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="postingMethod"
                value="keychain"
                checked={postingMethod === 'keychain'}
                onChange={() => setPostingMethod('keychain')}
              />
              <span className="ml-2">Hive Keychain</span>
            </label>
          )}
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="postingMethod"
              value="direct"
              checked={postingMethod === 'direct'}
              onChange={() => setPostingMethod('direct')}
            />
            <span className="ml-2">Direct Posting (requires private key)</span>
          </label>
        </div>
        
        {postingMethod === 'direct' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-2">
            <p className="font-bold">Security Notice:</p>
            <p>You're posting using the direct method. You'll need to enter your private posting key when publishing.</p>
            <p className="mt-2">For better security, we recommend installing the <a href="https://chrome.google.com/webstore/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep" target="_blank" rel="noopener noreferrer" className="underline">Hive Keychain extension</a>.</p>
          </div>
        )}
        
        {!window.hive_keychain && postingMethod === 'keychain' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-2">
            <p>Hive Keychain is not installed. Please install the extension or use direct posting.</p>
            <p className="mt-2">
              <a 
                href="https://chrome.google.com/webstore/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline"
              >
                Install Hive Keychain for Chrome
              </a>
            </p>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <button
            type="button"
            onClick={() => setPreview(false)}
            className={`px-4 py-2 rounded-t-lg ${!preview ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setPreview(true)}
            className={`px-4 py-2 rounded-t-lg ${preview ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Preview
          </button>
        </div>
        
        {!preview ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter post title"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="body">
                Content
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="12"
                placeholder="Write your post content here (Markdown supported)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Markdown formatting is supported. You can use **bold**, *italic*, [links](url), and upload images.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                Add Image
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              {uploadingImage && (
                <p className="text-sm text-blue-500 mt-1">
                  Uploading image...
                </p>
              )}
              {imageUrl && (
                <div className="mt-2">
                  <img 
                    src={imageUrl} 
                    alt="Uploaded preview" 
                    className="max-h-40 rounded border border-gray-300" 
                  />
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">
                Tags
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter tags separated by spaces (e.g., hivesocial blog tutorial)"
              />
              <p className="text-xs text-gray-500 mt-1">
                First tag will be your main category. We'll automatically post to the Hive community.
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Post'}
              </button>
              
              <button
                type="button"
                onClick={handleDirectPost}
                disabled={isSubmitting}
                className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-2 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Publishing...' : 'Simple Post'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/')}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="border rounded p-4">
            <h2 className="text-2xl font-bold mb-4">{title || 'Post Title'}</h2>
            <div className="prose max-w-none mb-4">
              {body ? 
                body.split('\n').map((paragraph, idx) => {
                  // Handle image markdown
                  if (paragraph.startsWith('![') && paragraph.includes('](') && paragraph.endsWith(')')) {
                    const altTextMatch = paragraph.match(/!\[(.*?)\]/);
                    const urlMatch = paragraph.match(/\((.*?)\)/);
                    
                    if (urlMatch && urlMatch[1]) {
                      return (
                        <div key={idx} className="my-4">
                          <img 
                            src={urlMatch[1]} 
                            alt={altTextMatch ? altTextMatch[1] : 'Post image'} 
                            className="max-w-full rounded" 
                          />
                        </div>
                      );
                    }
                  }
                  
                  // Handle regular paragraphs
                  return paragraph ? (
                    <p key={idx}>{paragraph}</p>
                  ) : (
                    <br key={idx} />
                  );
                })
              : (
                <p className="text-gray-500">Post content will appear here...</p>
              )}
            </div>
            {tags && (
              <div className="mt-4">
                {tags.split(' ').map((tag, index) => (
                  tag.trim() && (
                    <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                      #{tag.trim()}
                    </span>
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost; 