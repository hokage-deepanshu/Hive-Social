/**
 * Utility functions for chat functionality
 * Note: In a real app, you would use a real-time service like Socket.io, Firebase, or a custom WebSocket server
 */

// Mock data for demo purposes
const MOCK_CHATS = {
  conversations: {},
  messages: {}
};

/**
 * Get all conversations for a user
 */
export const getConversations = async (username) => {
  if (!username) {
    return { success: false, error: 'Username not provided' };
  }

  try {
    // In a real app, you would fetch this from your backend
    // For demo purposes, we'll generate some mock conversations
    
    // Check if we already have mock conversations for this user
    if (!MOCK_CHATS.conversations[username]) {
      // Generate 3-5 mock conversations
      const numConversations = Math.floor(Math.random() * 3) + 3;
      MOCK_CHATS.conversations[username] = [];
      
      for (let i = 0; i < numConversations; i++) {
        const otherUser = `user${i + 1}`;
        const lastMessageTime = new Date(Date.now() - Math.random() * 86400000 * 7); // Random time in the last week
        
        MOCK_CHATS.conversations[username].push({
          id: `conv-${username}-${otherUser}`,
          participants: [username, otherUser],
          lastMessage: {
            sender: Math.random() > 0.5 ? username : otherUser,
            content: `This is a sample message from ${Math.random() > 0.5 ? username : otherUser}`,
            timestamp: lastMessageTime.toISOString()
          },
          unreadCount: Math.floor(Math.random() * 5)
        });
      }
      
      // Sort by last message time
      MOCK_CHATS.conversations[username].sort((a, b) => 
        new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
      );
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      conversations: MOCK_CHATS.conversations[username]
    };
  } catch (error) {
    console.error('Error getting conversations:', error);
    return { success: false, error: error.message || 'Failed to get conversations' };
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (conversationId, options = {}) => {
  if (!conversationId) {
    return { success: false, error: 'Conversation ID not provided' };
  }

  const { limit = 20, before = null } = options;

  try {
    // In a real app, you would fetch this from your backend
    // For demo purposes, we'll generate some mock messages
    
    // Check if we already have mock messages for this conversation
    if (!MOCK_CHATS.messages[conversationId]) {
      // Extract participants from conversation ID
      const participants = conversationId.replace('conv-', '').split('-');
      
      // Generate 10-30 mock messages
      const numMessages = Math.floor(Math.random() * 20) + 10;
      MOCK_CHATS.messages[conversationId] = [];
      
      for (let i = 0; i < numMessages; i++) {
        const sender = participants[Math.floor(Math.random() * participants.length)];
        const timestamp = new Date(Date.now() - (numMessages - i) * 600000); // Messages spaced 10 minutes apart
        
        MOCK_CHATS.messages[conversationId].push({
          id: `msg-${conversationId}-${i}`,
          sender,
          content: `This is message #${i + 1} from ${sender}`,
          timestamp: timestamp.toISOString(),
          read: i < numMessages - 3 // Last 3 messages might be unread
        });
      }
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get messages, applying pagination if needed
    let messages = [...MOCK_CHATS.messages[conversationId]];
    
    if (before) {
      const beforeIndex = messages.findIndex(msg => msg.id === before);
      if (beforeIndex !== -1) {
        messages = messages.slice(0, beforeIndex);
      }
    }
    
    // Sort by timestamp (newest last)
    messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Apply limit
    if (messages.length > limit) {
      messages = messages.slice(messages.length - limit);
    }
    
    return {
      success: true,
      messages,
      hasMore: before ? messages.length >= limit : false
    };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { success: false, error: error.message || 'Failed to get messages' };
  }
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (conversationId, sender, content) => {
  if (!conversationId || !sender || !content) {
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    // In a real app, you would send this to your backend
    // For demo purposes, we'll add it to our mock data
    
    // Create the message
    const message = {
      id: `msg-${conversationId}-${Date.now()}`,
      sender,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Add to mock data
    if (!MOCK_CHATS.messages[conversationId]) {
      MOCK_CHATS.messages[conversationId] = [];
    }
    
    MOCK_CHATS.messages[conversationId].push(message);
    
    // Update the conversation's last message
    const participants = conversationId.replace('conv-', '').split('-');
    const otherParticipant = participants.find(p => p !== sender);
    
    if (MOCK_CHATS.conversations[sender]) {
      const conversation = MOCK_CHATS.conversations[sender].find(c => c.id === conversationId);
      if (conversation) {
        conversation.lastMessage = {
          sender,
          content,
          timestamp: message.timestamp
        };
      }
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      message
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message || 'Failed to send message' };
  }
};

/**
 * Create a new conversation
 */
export const createConversation = async (creator, recipient) => {
  if (!creator || !recipient) {
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    // In a real app, you would create this in your backend
    // For demo purposes, we'll add it to our mock data
    
    // Create conversation ID (alphabetically sort participants)
    const participants = [creator, recipient].sort();
    const conversationId = `conv-${participants[0]}-${participants[1]}`;
    
    // Check if conversation already exists
    if (MOCK_CHATS.conversations[creator]) {
      const existingConv = MOCK_CHATS.conversations[creator].find(c => c.id === conversationId);
      if (existingConv) {
        return {
          success: true,
          conversation: existingConv,
          existing: true
        };
      }
    }
    
    // Create the conversation
    const conversation = {
      id: conversationId,
      participants,
      lastMessage: null,
      unreadCount: 0
    };
    
    // Add to mock data
    if (!MOCK_CHATS.conversations[creator]) {
      MOCK_CHATS.conversations[creator] = [];
    }
    
    MOCK_CHATS.conversations[creator].push(conversation);
    
    // Initialize messages array
    MOCK_CHATS.messages[conversationId] = [];
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      conversation
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return { success: false, error: error.message || 'Failed to create conversation' };
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (conversationId, username) => {
  if (!conversationId || !username) {
    return { success: false, error: 'Missing required parameters' };
  }

  try {
    // In a real app, you would update this in your backend
    // For demo purposes, we'll update our mock data
    
    if (MOCK_CHATS.messages[conversationId]) {
      // Mark all messages not from the user as read
      MOCK_CHATS.messages[conversationId].forEach(message => {
        if (message.sender !== username) {
          message.read = true;
        }
      });
    }
    
    // Update unread count in conversation
    if (MOCK_CHATS.conversations[username]) {
      const conversation = MOCK_CHATS.conversations[username].find(c => c.id === conversationId);
      if (conversation) {
        conversation.unreadCount = 0;
      }
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message || 'Failed to mark messages as read' };
  }
};

export default {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markMessagesAsRead
}; 