import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiveContext } from '../App';
import { Avatar } from '../utils/ImageUtils';

const PostView = () => {
  const { author, permlink } = useParams();
  const { client, user, isKeychain } = useContext(HiveContext);
  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [voted, setVoted] = useState(false);
  const [voteWeight, setVoteWeight] = useState(10000); // 100%
  
  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch the post content
        const postData = await client.database.call('get_content', [author, permlink]);
        
        if (postData && postData.author) {
          setPost(postData);
          
          // Check if the current user has voted on this post
          if (user && postData.active_votes) {
            const userVote = postData.active_votes.find(vote => vote.voter === user);
            if (userVote) {
              setVoted(true);
              setVoteWeight(userVote.percent);
            }
          }
          
          // Fetch comments
          const commentsData = await client.database.call('get_content_replies', [author, permlink]);
          setComments(commentsData);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (client && author && permlink) {
      fetchPost();
    }
  }, [client, author, permlink, user]);
  
  const handleVote = async () => {
    if (!user || !isKeychain) {
      setError('Please login with Hive Keychain to vote');
      return;
    }
    
    try {
      window.hive_keychain.requestVote(
        user,
        permlink,
        author,
        voted ? 0 : voteWeight, // Toggle vote
        (response) => {
          if (response.success) {
            setVoted(!voted);
            
            // Update the post to reflect the new vote
            setPost(prevPost => {
              if (!prevPost) return null;
              
              // Create a copy of active_votes
              let newActiveVotes = [...prevPost.active_votes];
              
              if (!voted) {
                // Add the vote
                newActiveVotes.push({
                  voter: user,
                  percent: voteWeight,
                  time: new Date().toISOString()
                });
              } else {
                // Remove the vote
                newActiveVotes = newActiveVotes.filter(vote => vote.voter !== user);
              }
              
              return {
                ...prevPost,
                active_votes: newActiveVotes,
                net_votes: voted ? prevPost.net_votes - 1 : prevPost.net_votes + 1
              };
            });
          } else {
            setError(`Voting failed: ${response.message}`);
          }
        }
      );
    } catch (err) {
      console.error('Error voting:', err);
      setError(`Voting failed: ${err.message || 'Unknown error'}`);
    }
  };
  
  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!commentBody.trim()) {
      setCommentError('Please enter a comment');
      return;
    }
    
    if (!user || !isKeychain) {
      setCommentError('Please login with Hive Keychain to comment');
      return;
    }
    
    setSubmittingComment(true);
    setCommentError('');
    
    try {
      // Generate a unique permlink for the comment
      const commentPermlink = `re-${permlink.replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
      
      // Prepare comment metadata
      const jsonMetadata = {
        app: 'hivesocial/1.0.0',
        format: 'markdown'
      };
      
      window.hive_keychain.requestComment(
        user,
        permlink,
        author,
        commentPermlink,
        '',
        commentBody,
        JSON.stringify(jsonMetadata),
        (response) => {
          setSubmittingComment(false);
          
          if (response.success) {
            // Clear comment input
            setCommentBody('');
            
            // Add the new comment to the list
            const newComment = {
              author: user,
              permlink: commentPermlink,
              body: commentBody,
              created: new Date().toISOString(),
              net_votes: 0,
              pending_payout_value: '0.000 HBD'
            };
            
            setComments(prevComments => [newComment, ...prevComments]);
          } else {
            setCommentError(`Comment failed: ${response.message}`);
          }
        }
      );
    } catch (err) {
      console.error('Error commenting:', err);
      setCommentError(`Comment failed: ${err.message || 'Unknown error'}`);
      setSubmittingComment(false);
    }
  };
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'Z');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Parse JSON metadata
  const getMetadata = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return {};
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link to="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Post not found
        </div>
        <Link to="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }
  
  const metadata = getMetadata(post.json_metadata);
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
        ← Back to Home
      </Link>
      
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      
      <div className="flex items-center mb-6">
        <Link to={`/profile/${post.author}`} className="flex items-center">
          <Avatar username={post.author} size="md" className="mr-2" />
          <span className="font-medium text-gray-800">@{post.author}</span>
        </Link>
        <span className="mx-2 text-gray-500">•</span>
        <span className="text-gray-500">{formatDate(post.created)}</span>
      </div>
      
      {/* Post content */}
      <div className="prose max-w-none mb-8">
        {post.body.split('\n').map((paragraph, idx) => {
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
        })}
      </div>
      
      {/* Tags */}
      {metadata.tags && metadata.tags.length > 0 && (
        <div className="mb-6">
          {metadata.tags.map((tag, index) => (
            <span key={index} className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Post actions */}
      <div className="flex items-center justify-between border-t border-b border-gray-200 py-4 mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleVote}
            className={`flex items-center space-x-1 ${voted ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-700`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>{post.net_votes} {post.net_votes === 1 ? 'vote' : 'votes'}</span>
          </button>
          
          <div className="flex items-center space-x-1 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
          </div>
        </div>
        
        <div className="text-gray-500">
          <span>Payout: {post.pending_payout_value}</span>
        </div>
      </div>
      
      {/* Comment form */}
      {user && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Leave a Comment</h3>
          
          {commentError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {commentError}
            </div>
          )}
          
          <form onSubmit={handleComment}>
            <div className="mb-4">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="4"
                placeholder="Write your comment here..."
              />
            </div>
            
            <button
              type="submit"
              disabled={submittingComment}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                submittingComment ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submittingComment ? 'Submitting...' : 'Submit Comment'}
            </button>
          </form>
        </div>
      )}
      
      {/* Comments section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Comments ({comments.length})</h3>
        
        {comments.length === 0 ? (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-6">
            {comments.map((comment, index) => (
              <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex items-center mb-2">
                  <Link to={`/profile/${comment.author}`} className="flex items-center">
                    <Avatar username={comment.author} size="sm" className="mr-2" />
                    <span className="font-medium text-gray-800">@{comment.author}</span>
                  </Link>
                  <span className="mx-2 text-gray-500">•</span>
                  <span className="text-gray-500">{formatDate(comment.created)}</span>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  {comment.body.split('\n').map((paragraph, idx) => (
                    paragraph ? (
                      <p key={idx}>{paragraph}</p>
                    ) : (
                      <br key={idx} />
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostView; 