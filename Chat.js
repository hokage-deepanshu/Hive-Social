import React, { useState, useEffect, useRef, useContext } from 'react';
import { HiveContext } from '../App';
import { Avatar } from '../utils/ImageUtils';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  createConversation,
  markMessagesAsRead
} from '../utils/ChatUtils';

const Chat = () => {
  const { user } = useContext(HiveContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Load conversations when component mounts
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus message input when conversation is selected
  useEffect(() => {
    if (selectedConversation && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedConversation]);

  // Load user's conversations
  const loadConversations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await getConversations(user.name);
      if (result.success) {
        setConversations(result.conversations);
      } else {
        setError('Failed to load conversations');
      }
    } catch (err) {
      setError('Error loading conversations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await getMessages(conversationId);
      if (result.success) {
        setMessages(result.messages);
      } else {
        setError('Failed to load messages');
      }
    } catch (err) {
      setError('Error loading messages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!selectedConversation || !newMessage.trim() || !user) {
      return;
    }
    
    setSendingMessage(true);
    setError('');
    
    try {
      const result = await sendMessage(
        selectedConversation.id,
        user.name,
        newMessage
      );
      
      if (result.success) {
        setMessages(prevMessages => [...prevMessages, result.message]);
        setNewMessage('');
        
        // Update the conversation's last message
        updateConversationLastMessage(
          selectedConversation.id,
          user.name,
          newMessage,
          new Date().toISOString()
        );
      } else {
        setError('Failed to send message');
      }
    } catch (err) {
      setError('Error sending message: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Start a new conversation
  const handleStartNewChat = async (e) => {
    e.preventDefault();
    
    if (!newChatUsername.trim() || !user) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await createConversation(user.name, newChatUsername);
      
      if (result.success) {
        // If this is a new conversation, add it to the list
        if (!result.existing) {
          setConversations(prevConversations => [
            result.conversation,
            ...prevConversations
          ]);
        }
        
        // Select the conversation
        setSelectedConversation(result.conversation);
        setShowNewChat(false);
        setNewChatUsername('');
      } else {
        setError('Failed to create conversation');
      }
    } catch (err) {
      setError('Error creating conversation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read
  const markAsRead = async (conversationId) => {
    if (!user) return;
    
    try {
      await markMessagesAsRead(conversationId, user.name);
      
      // Update the unread count in the conversation list
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 } 
            : conv
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Update a conversation's last message
  const updateConversationLastMessage = (conversationId, sender, content, timestamp) => {
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              lastMessage: { sender, content, timestamp } 
            } 
          : conv
      )
    );
  };

  // Scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Format date for messages
  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for conversation list
  const formatConversationDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get the other participant in a conversation
  const getOtherParticipant = (conversation) => {
    if (!user || !conversation) return '';
    return conversation.participants.find(p => p !== user.name) || '';
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Chat</h2>
        <p className="text-gray-600 mb-4">Please login to use the chat feature.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex h-[600px]">
        {/* Conversations list */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Messages</h2>
            <button 
              onClick={() => setShowNewChat(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
              title="New message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* New chat form */}
          {showNewChat && (
            <div className="p-4 border-b border-gray-200">
              <form onSubmit={handleStartNewChat} className="space-y-2">
                <input
                  type="text"
                  value={newChatUsername}
                  onChange={(e) => setNewChatUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewChat(false)}
                    className="px-3 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    disabled={!newChatUsername.trim()}
                  >
                    Start Chat
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="animate-pulse p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((conversation) => {
                const otherUser = getOtherParticipant(conversation);
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 flex items-center ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Avatar username={otherUser} className="mr-3" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">@{otherUser}</h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatConversationDate(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.sender === user.name ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                      {conversation.unreadCount > 0 && (
                        <span className="inline-block bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 mt-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500">
                No conversations yet. Start a new chat!
              </div>
            )}
          </div>
        </div>
        
        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 flex items-center">
                <Avatar username={getOtherParticipant(selectedConversation)} className="mr-3" />
                <h3 className="font-medium">@{getOtherParticipant(selectedConversation)}</h3>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
                        <div className={`rounded-lg p-3 max-w-xs ${i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'}`}>
                          <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-32"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const isOwnMessage = message.sender === user.name;
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : ''}`}>
                        {!isOwnMessage && (
                          <Avatar username={message.sender} size="sm" className="mr-2 self-end" />
                        )}
                        <div 
                          className={`rounded-lg p-3 max-w-xs ${
                            isOwnMessage 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p>{message.content}</p>
                          <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                            {formatMessageDate(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No messages yet. Start the conversation!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                    disabled={sendingMessage || !newMessage.trim()}
                  >
                    {sendingMessage ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Your Messages</h3>
                <p className="mb-4">Select a conversation or start a new chat</p>
                <button 
                  onClick={() => setShowNewChat(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  New Message
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3">
          {error}
        </div>
      )}
    </div>
  );
};

export default Chat; 