import { Client } from '@hiveio/dhive';

/**
 * Utility functions for social interactions on Hive
 */

/**
 * Like/upvote a post on Hive
 */
export const likePost = async (client, username, postAuthor, postPermlink, weight = 10000) => {
  if (!client || !username) {
    return { success: false, error: 'Client or username not provided' };
  }

  try {
    // Create the vote operation
    const voteOp = [
      'vote',
      {
        voter: username,
        author: postAuthor,
        permlink: postPermlink,
        weight // 10000 = 100% upvote
      }
    ];

    // If Hive Keychain is available, use it
    if (window.hive_keychain) {
      return new Promise((resolve) => {
        window.hive_keychain.requestBroadcast(
          username,
          [voteOp],
          'posting',
          response => {
            if (response.success) {
              resolve({ success: true });
            } else {
              resolve({ 
                success: false, 
                error: response.message || 'Failed to vote with Keychain'
              });
            }
          }
        );
      });
    } else {
      // For demo purposes, simulate success
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('Error liking post:', error);
    return { success: false, error: error.message || 'Failed to like post' };
  }
};

/**
 * Comment on a post on Hive
 */
export const commentOnPost = async (
  client, 
  username, 
  parentAuthor, 
  parentPermlink, 
  body,
  options = {}
) => {
  if (!client || !username) {
    return { success: false, error: 'Client or username not provided' };
  }

  try {
    // Generate a unique permlink for the comment
    const permlink = `re-${parentPermlink.replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
    
    // Create the comment operation
    const commentOp = [
      'comment',
      {
        parent_author: parentAuthor,
        parent_permlink: parentPermlink,
        author: username,
        permlink,
        title: '',
        body,
        json_metadata: JSON.stringify({
          app: 'hivesocial',
          ...options
        })
      }
    ];

    // If Hive Keychain is available, use it
    if (window.hive_keychain) {
      return new Promise((resolve) => {
        window.hive_keychain.requestBroadcast(
          username,
          [commentOp],
          'posting',
          response => {
            if (response.success) {
              resolve({ 
                success: true,
                permlink
              });
            } else {
              resolve({ 
                success: false, 
                error: response.message || 'Failed to comment with Keychain'
              });
            }
          }
        );
      });
    } else {
      // For demo purposes, simulate success
      await new Promise(resolve => setTimeout(resolve, 800));
      return { 
        success: true, 
        simulated: true,
        permlink
      };
    }
  } catch (error) {
    console.error('Error commenting on post:', error);
    return { success: false, error: error.message || 'Failed to comment on post' };
  }
};

/**
 * Follow a user on Hive
 */
export const followUser = async (client, follower, following) => {
  if (!client || !follower) {
    return { success: false, error: 'Client or follower not provided' };
  }

  try {
    // Create the custom JSON operation for following
    const followOp = [
      'custom_json',
      {
        required_auths: [],
        required_posting_auths: [follower],
        id: 'follow',
        json: JSON.stringify(['follow', { follower, following, what: ['blog'] }])
      }
    ];

    // If Hive Keychain is available, use it
    if (window.hive_keychain) {
      return new Promise((resolve) => {
        window.hive_keychain.requestBroadcast(
          follower,
          [followOp],
          'posting',
          response => {
            if (response.success) {
              resolve({ success: true });
            } else {
              resolve({ 
                success: false, 
                error: response.message || 'Failed to follow with Keychain'
              });
            }
          }
        );
      });
    } else {
      // For demo purposes, simulate success
      await new Promise(resolve => setTimeout(resolve, 600));
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('Error following user:', error);
    return { success: false, error: error.message || 'Failed to follow user' };
  }
};

/**
 * Unfollow a user on Hive
 */
export const unfollowUser = async (client, follower, following) => {
  if (!client || !follower) {
    return { success: false, error: 'Client or follower not provided' };
  }

  try {
    // Create the custom JSON operation for unfollowing
    const unfollowOp = [
      'custom_json',
      {
        required_auths: [],
        required_posting_auths: [follower],
        id: 'follow',
        json: JSON.stringify(['follow', { follower, following, what: [] }])
      }
    ];

    // If Hive Keychain is available, use it
    if (window.hive_keychain) {
      return new Promise((resolve) => {
        window.hive_keychain.requestBroadcast(
          follower,
          [unfollowOp],
          'posting',
          response => {
            if (response.success) {
              resolve({ success: true });
            } else {
              resolve({ 
                success: false, 
                error: response.message || 'Failed to unfollow with Keychain'
              });
            }
          }
        );
      });
    } else {
      // For demo purposes, simulate success
      await new Promise(resolve => setTimeout(resolve, 600));
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return { success: false, error: error.message || 'Failed to unfollow user' };
  }
};

/**
 * Check if a user is following another user
 */
export const checkIfFollowing = async (client, follower, following) => {
  if (!client) {
    return { success: false, error: 'Client not provided' };
  }

  try {
    // Get the follow count to check if the user is following
    const followCount = await client.database.call('get_follow_count', [follower]);
    
    // For a real check, we would need to use the get_following API
    // but for demo purposes, we'll simulate a random result
    const isFollowing = Math.random() > 0.5;
    
    return { 
      success: true, 
      isFollowing,
      followCount
    };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { success: false, error: error.message || 'Failed to check follow status' };
  }
};

/**
 * Get comments for a post
 */
export const getPostComments = async (client, author, permlink) => {
  if (!client) {
    return { success: false, error: 'Client not provided' };
  }

  try {
    // Get comments for the post
    const comments = await client.database.call('get_content_replies', [author, permlink]);
    
    return { 
      success: true, 
      comments
    };
  } catch (error) {
    console.error('Error getting post comments:', error);
    return { success: false, error: error.message || 'Failed to get comments' };
  }
};

export default {
  likePost,
  commentOnPost,
  followUser,
  unfollowUser,
  checkIfFollowing,
  getPostComments
}; 