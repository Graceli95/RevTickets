'use client';

// ENHANCEMENT L3: KB CHAT - Main knowledge base chat interface

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, TextInput, Badge, Spinner, Tooltip, Modal } from 'flowbite-react';
import { Send, Plus, Trash2, Ticket, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useKBChat } from '@/hooks/useKBChat';
import { useChatSessions } from '@/hooks/useChatSessions';
import { ChatMessage } from '@/types/chat';

interface Source {
  id: string;
  title: string;
  excerpt: string;
  relevance: number;
  url: string;
}

interface ChatResponse {
  response: string;
  sources: Source[];
  session_id: string;
  timestamp: string;
  error?: string;
}


export default function KBChatPage() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [sessionRating, setSessionRating] = useState(0);
  const [ticketData, setTicketData] = useState<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>({
    title: '',
    description: '',
    priority: 'medium'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    sessions,
    loading: sessionsLoading,
    createSession,
    deleteSession,
    refreshSessions
  } = useChatSessions();
  
  const {
    sendMessage,
    loading: messageLoading,
    rateSession,
    convertToTicket
  } = useKBChat();

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load session messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/kb-chat/sessions/${sessionId}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const sessionMessages = await response.json();
        setMessages(sessionMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleStartNewChat = async () => {
    try {
      const session = await createSession();
      setCurrentSessionId(session.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentSessionId || messageLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: message.trim(),
      message_type: 'user',
      timestamp: new Date().toISOString(),
      sources: []
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage('');

    try {
      const response: ChatResponse = await sendMessage(currentSessionId, currentMessage);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: response.response,
        message_type: 'assistant',
        timestamp: response.timestamp,
        sources: response.sources || []
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.error) {
        console.error('Chat error:', response.error);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: 'Sorry, I encountered an error processing your message. Please try again.',
        message_type: 'assistant',
        timestamp: new Date().toISOString(),
        sources: []
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleRateSession = async () => {
    if (!currentSessionId || sessionRating === 0) return;
    
    try {
      await rateSession(currentSessionId, sessionRating);
      setShowRatingModal(false);
      setSessionRating(0);
      refreshSessions();
    } catch (error) {
      console.error('Failed to rate session:', error);
    }
  };

  const handleConvertToTicket = async () => {
    if (!currentSessionId || !ticketData.title.trim()) return;
    
    try {
      const result = await convertToTicket(currentSessionId, ticketData);
      setShowTicketModal(false);
      setTicketData({ title: '', description: '', priority: 'medium' });
      refreshSessions();
      
      // Show success message or redirect to ticket
      alert(`Ticket created successfully! ID: ${result.ticket_id}`);
    } catch (error) {
      console.error('Failed to convert to ticket:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen max-h-screen">
          
          {/* Sidebar - Chat Sessions */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border p-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Chat Sessions</h2>
              <Button size="sm" onClick={handleStartNewChat}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {sessionsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className={`cursor-pointer transition-colors ${
                      currentSessionId === session.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentSessionId(session.id)}
                  >
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm truncate flex-1 mr-2">
                          {session.title}
                        </h3>
                        <Button
                          size="xs"
                          color="gray"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        {session.message_count} messages
                      </div>
                      
                      {session.topics_discussed.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {session.topics_discussed.slice(0, 3).map((topic, idx) => (
                            <Badge key={idx} color="blue" size="sm">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </span>
                        {session.satisfaction_rating && (
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400" />
                            <span className="text-xs ml-1">{session.satisfaction_rating}</span>
                          </div>
                        )}
                      </div>
                      
                      {session.converted_to_ticket && (
                        <Badge color="green" size="sm" className="mt-2">
                          Converted to Ticket
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
                
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No chat sessions yet.</p>
                    <p className="text-sm">Start a new chat to begin!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
            {currentSessionId ? (
              <>
                {/* Chat Header */}
                <div className="border-b p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900">
                        {currentSession?.title || 'Knowledge Base Chat'}
                      </h1>
                      <p className="text-sm text-gray-600">
                        Ask questions about our knowledge base articles
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Tooltip content="Rate this chat session">
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => setShowRatingModal(true)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      
                      <Tooltip content="Convert to support ticket">
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => setShowTicketModal(true)}
                          disabled={currentSession?.converted_to_ticket}
                        >
                          <Ticket className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-4">
                        Start a conversation! Ask me anything about our knowledge base.
                      </p>
                      <p className="text-sm text-gray-400">
                        Try asking: &quot;How do I reset my password?&quot; or &quot;Tell me about billing policies&quot;
                      </p>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-3xl p-3 rounded-lg ${
                          msg.message_type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="text-sm font-medium mb-2">Sources:</p>
                            <div className="space-y-2">
                              {msg.sources.map((source, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white p-2 rounded border text-sm"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <Link
                                      href={source.url}
                                      className="font-medium text-blue-600 hover:underline"
                                      target="_blank"
                                    >
                                      {source.title}
                                      <ExternalLink className="inline h-3 w-3 ml-1" />
                                    </Link>
                                    <Badge size="sm" color="blue">
                                      {Math.round(source.relevance * 100)}% match
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600">{source.excerpt}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {messageLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <Spinner size="sm" />
                        <span className="ml-2 text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-3">
                    <TextInput
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question about our knowledge base..."
                      className="flex-1"
                      disabled={messageLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || messageLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Knowledge Base Chat
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Get instant answers from our knowledge base using AI
                  </p>
                  <Button onClick={handleStartNewChat}>
                    Start New Chat
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <Modal show={showRatingModal} onClose={() => setShowRatingModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Rate This Chat Session</h3>
          <div className="text-center">
            <p className="mb-4">How helpful was this chat session?</p>
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setSessionRating(value)}
                  className={`p-1 transition-colors ${
                    value <= sessionRating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <Star className={`h-6 w-6 ${value <= sessionRating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleRateSession} disabled={sessionRating === 0}>
              Submit Rating
            </Button>
            <Button color="gray" onClick={() => setShowRatingModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ticket Conversion Modal */}
      <Modal show={showTicketModal} onClose={() => setShowTicketModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Convert Chat to Support Ticket</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Title
              </label>
              <TextInput
                value={ticketData.title}
                onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Description
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                value={ticketData.description}
                onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                placeholder="Any additional details..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={ticketData.priority}
                onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value as typeof ticketData.priority })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleConvertToTicket} disabled={!ticketData.title.trim()}>
              Create Ticket
            </Button>
            <Button color="gray" onClick={() => setShowTicketModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}