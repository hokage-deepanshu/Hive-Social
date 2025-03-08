import React, { memo, useState, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { HiveContext } from '../App';
import { Avatar, getPostImageUrl } from '../utils/ImageUtils';
import { likePost, commentOnPost } from '../utils/SocialUtils';

const Post = memo(({ post, priority, showComments = false }) => {
  const { client, user, isKeychain } = useContext(HiveContext);
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [hasVoted, setHasVoted] = useState(
    post.active_votes?.some(vote => user && vote.voter === user.name)
  );
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const commentInputRef = useRef(null);

  // Format date as relative time
  const formatDate = (date) => {
    try {
      // Simple relative time formatting
      const now = new Date();
      const postDate = new Date(date + 'Z');
      const diffMs = now - postDate;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffSec < 60) return `${diffSec} seconds ago`;
      if (diffMin < 60) return `${diffMin} minutes ago`;
      if (diffHour < 24) return `${diffHour} hours ago`;
      if (diffDay < 30) return `${diffDay} days ago`;
      
      return postDate.toLocaleDateString();
    } catch (e) {
      return new Date(date + 'Z').toLocaleDateString();
    }
  };

  // Handle voting on posts
  const handleVote = async () => {
    if (!user || !isKeychain) {
      alert('Please login with Hive Keychain to vote');
      return;
    }
    
    setIsVoting(true);
    setVoteError('');
    
    try {
      const result = await likePost(client, user.name, post.author, post.permlink);
      
      if (result.success) {
        setHasVoted(true);
      } else {
        setVoteError(result.error || 'Failed to vote');
      }
    } catch (err) {
      setVoteError('Error voting: ' + err.message);
    } finally {
      setIsVoting(false);
    }
  };

  // Handle commenting on posts
  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!user || !isKeychain) {
      alert('Please login with Hive Keychain to comment');
      return;
    }
    
    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty');
      return;
    }
    
    setIsCommenting(true);
    setCommentError('');
    
    try {
      const result = await commentOnPost(
        client, 
        user.name, 
        post.author, 
        post.permlink, 
        commentText
      );
      
      if (result.success) {
        // Add the new comment to the list
        const newComment = {
          author: user.name,
          permlink: result.permlink,
          body: commentText,
          created: new Date().toISOString().replace('Z', ''),
          net_votes: 0,
          pending_payout_value: '0.000 HBD'
        };
        
        setComments(prevComments => [newComment, ...prevComments]);
        setCommentText('');
        setShowCommentForm(false);
      } else {
        setCommentError(result.error || 'Failed to post comment');
      }
    } catch (err) {
      setCommentError('Error commenting: ' + err.message);
    } finally {
      setIsCommenting(false);
    }
  };

  // Toggle comment form
  const toggleCommentForm = () => {
    setShowCommentForm(prev => !prev);
    // Focus the comment input when showing the form
    if (!showCommentForm) {
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 100);
    }
  };

  // Load comments for the post
  const loadComments = async () => {
    if (loadingComments || comments.length > 0) return;
    
    setLoadingComments(true);
    
    try {
      const result = await client.database.call('get_content_replies', [post.author, post.permlink]);
      if (Array.isArray(result)) {
        setComments(result);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Calculate estimated payout value
  const getPayoutValue = () => {
    const pendingPayout = parseFloat(post.pending_payout_value);
    const totalPayout = parseFloat(post.total_payout_value);
    const curatorPayout = parseFloat(post.curator_payout_value);
    
    return pendingPayout > 0 
      ? pendingPayout 
      : totalPayout + curatorPayout;
  };

  // Process post content for preview
  const getPostPreview = () => {
    // Simple text processing without external libraries
    let preview = post.body
      .replace(/!\[.*?\]\(.*?\)/g, '[Image]') // Replace images
      .replace(/\[.*?\]\(.*?\)/g, '$1')       // Replace links
      .replace(/<\/?[^>]+(>|$)/g, '')         // Remove HTML tags
      .replace(/#+\s/g, '')                   // Remove heading markers
      .replace(/\*\*/g, '')                   // Remove bold markers
      .trim();
    
    // Limit to ~200 characters
    if (preview.length > 200) {
      preview = preview.substring(0, 200) + '...';
    }
    
    return preview;
  };

  // Extract media from post
  const getPostMedia = () => {
    try {
      // Try to extract image from post metadata
      if (post.json_metadata) {
        const metadata = JSON.parse(post.json_metadata);
        if (metadata.image && metadata.image.length > 0) {
          return metadata.image[0];
        }
      }
      
      // Try to extract first image from post body
      const imageRegex = /!\[.*?\]\((.*?)\)/;
      const match = post.body.match(imageRegex);
      if (match && match[1]) {
        return match[1];
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  // If showComments is true, load comments when the component mounts
  React.useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments]);

  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <header className="flex items-center mb-4">
        <Link
          to={`/profile/${post.author}`}
          className="flex items-center group"
        >
          <Avatar username={post.author} className="mr-3" />
          <span className="text-blue-600 hover:text-blue-800 font-medium group-hover:underline">
            @{post.author}
          </span>
        </Link>
        <span className="text-gray-500 mx-2">•</span>
        <time 
          className="text-gray-500" 
          dateTime={post.created}
          title={new Date(post.created + 'Z').toLocaleString()}
        >
          {formatDate(post.created)}
        </time>
      </header>
      
      <Link to={`/@${post.author}/${post.permlink}`} className="block hover:no-underline">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 hover:text-blue-600 transition-colors">
          {post.title}
        </h2>
        
        {/* Post media */}
        {(() => {
          const mediaUrl = getPostMedia();
          if (mediaUrl) {
            return (
              <div className="mb-4 overflow-hidden rounded-lg">
                <img 
                  src={mediaUrl} 
                  alt={post.title}
                  className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            );
          }
          return null;
        })()}
        
        <div className="text-gray-600 mb-4">
          {getPostPreview()}
        </div>
      </Link>
      
      {post.json_metadata && (
        <div className="flex flex-wrap gap-2 mb-4">
          {(() => {
            try {
              const metadata = JSON.parse(post.json_metadata);
              return metadata.tags?.slice(0, 3).map(tag => (
                <span 
                  key={tag} 
                  className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                >
                  #{tag}
                </span>
              ));
            } catch (e) {
              return null;
            }
          })()}
        </div>
      )}
      
      <footer className="flex items-center justify-between text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleVote}
            disabled={isVoting || !user || hasVoted}
            className={`flex items-center space-x-1 ${
              hasVoted ? 'text-blue-600' : 'hover:text-blue-600'
            } transition-colors disabled:opacity-50`}
            title={!user ? 'Login to vote' : hasVoted ? 'You already voted' : 'Vote'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span>{post.net_votes}</span>
          </button>
          
          <button 
            onClick={toggleCommentForm}
            className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{post.children}</span>
          </button>
          
          <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        </div>
        
        <div className="text-sm font-medium">
          ${getPayoutValue().toFixed(2)}
        </div>
      </footer>
      
      {voteError && (
        <div className="mt-3 text-red-500 text-sm">
          {voteError}
        </div>
      )}
      
      {/* Comment form */}
      {showCommentForm && (
        <div className="mt-4">
          <form onSubmit={handleComment} className="space-y-3">
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              disabled={isCommenting}
            />
            {commentError && (
              <div className="text-red-500 text-sm">
                {commentError}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCommentForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isCommenting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isCommenting || !commentText.trim()}
              >
                {isCommenting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Comments section */}
      {showComments && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
          
          {loadingComments ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.permlink} className="border-l-2 border-gray-200 pl-4 py-2">
                  <div className="flex items-center mb-2">
                    <Link to={`/profile/${comment.author}`} className="flex items-center">
                      <Avatar username={comment.author} size="sm" className="mr-2" />
                      <span className="text-blue-600 font-medium">@{comment.author}</span>
                    </Link>
                    <span className="text-gray-500 mx-2">•</span>
                    <time className="text-gray-500 text-sm">
                      {formatDate(comment.created)}
                    </time>
                  </div>
                  <div className="text-gray-700">
                    {comment.body}
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <button className="flex items-center space-x-1 hover:text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span>{comment.net_votes}</span>
                    </button>
                    <span className="mx-3">•</span>
                    <span>${parseFloat(comment.pending_payout_value).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      )}
    </article>
  );
});

Post.displayName = 'Post';

export default Post; 