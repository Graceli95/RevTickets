'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, Button, Avatar, Textarea } from 'flowbite-react';
import { ArrowLeft, MessageCircle, AlertCircle, Edit3, CheckCircle2, XCircle, Home, Tag as TagIcon, Brain, Sparkles } from 'lucide-react';
import { MainLayout, ProtectedRoute } from '../../../src/app/shared/components';
import { Badge, LoadingSpinner } from '../../../src/app/shared/components';
import { RichTextEditor } from '../../../src/app/shared/components/RichTextEditor';
import { ticketsApi } from '../../../src/lib/api';
import { formatFullDateTime } from '../../../src/lib/utils';
import { useAuth } from '../../../src/contexts/AuthContext';
import type { Ticket, Comment, CreateComment, RichTextContent, TicketStatus, ClosingCommentsResponse } from '../../../src/app/shared/types';
import { createEmptyRichText, convertLegacyContent } from '../../../src/lib/utils';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState<RichTextContent>(createEmptyRichText());
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Status management states
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closingComment, setClosingComment] = useState('');

  // ENHANCEMENT L1 AI CLOSING SUGGESTIONS - AI closing suggestions state
  const [closingSuggestions, setClosingSuggestions] = useState<ClosingCommentsResponse | null>(null);
  const [generatingClosingSuggestions, setGeneratingClosingSuggestions] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const fetchTicketData = useCallback(async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      const [ticketData, commentsData] = await Promise.all([
        ticketsApi.getById(ticketId),
        ticketsApi.getComments(ticketId),
      ]);
      console.log('Ticket createdAt:', ticketData.createdAt);
      console.log('Ticket updatedAt:', ticketData.updatedAt);
      console.log('Current time:', new Date().toISOString());
      console.log('Ticket tagIds:', ticketData.tagIds);
      console.log('Full ticket data:', ticketData);
      setTicket(ticketData);
      setComments(commentsData);
    } catch (error) {
      console.error('Failed to fetch ticket data:', error);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      fetchTicketData();
    }
  }, [ticketId, fetchTicketData]);

  const handleAddComment = async () => {
    if (!ticketId || !newComment.text.trim()) return;

    try {
      setSubmittingComment(true);
      const commentData: CreateComment = {
        content: newComment,
      };
      
      const newCommentData = await ticketsApi.createComment(ticketId, commentData);
      setComments([...comments, newCommentData]);
      setNewComment(createEmptyRichText());
      
      // Refresh ticket data to get updated status if it changed
      // (e.g., when user responds to a ticket that was waiting for customer)
      const updatedTicket = await ticketsApi.getById(ticketId);
      setTicket(updatedTicket);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusUpdate = async (newStatus: TicketStatus) => {
    if (!ticketId || !ticket) return;

    try {
      setUpdatingStatus(true);
      await ticketsApi.updateStatus(ticketId, newStatus);
      
      // Update local ticket state
      setTicket({ ...ticket, status: newStatus });
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!ticketId || !ticket || !closingComment.trim()) return;

    try {
      setUpdatingStatus(true);
      
      // Add closing comment first
      const commentData: CreateComment = {
        content: {
          html: `<p>${closingComment}</p>`,
          json: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: closingComment }]
              }
            ]
          },
          text: closingComment
        }
      };
      
      const newCommentData = await ticketsApi.createComment(ticketId, commentData);
      setComments([...comments, newCommentData]);
      
      // Then close the ticket
      await ticketsApi.updateStatus(ticketId, 'closed');
      setTicket({ ...ticket, status: 'closed' });
      
      // Reset form
      setClosingComment('');
      setShowCloseForm(false);
    } catch (error) {
      console.error('Failed to close ticket:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Check if current user can modify this ticket (agent assigned to it)
  const canModifyTicket = user?.role === 'agent' && ticket?.agentInfo?.id === user.id;

  // ENHANCEMENT L1 AI CLOSING SUGGESTIONS - Generate closing suggestions function
  const handleGenerateClosingSuggestions = async () => {
    if (!ticketId) return;

    try {
      setGeneratingClosingSuggestions(true);
      const response = await ticketsApi.generateClosingComments(ticketId);
      setClosingSuggestions(response);
      setShowAISuggestions(true);
    } catch (error) {
      console.error('Failed to generate closing suggestions:', error);
    } finally {
      setGeneratingClosingSuggestions(false);
    }
  };

  // ENHANCEMENT L1 AI CLOSING SUGGESTIONS - Apply AI suggestion to closing comment
  const handleApplyAISuggestion = (comment: string) => {
    setClosingComment(comment);
    setShowAISuggestions(false);
  };
  

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex justify-center items-center min-h-screen">
            <LoadingSpinner text="Loading ticket..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!ticket) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Ticket not found</h3>
                <p className="text-sm">The requested ticket could not be loaded.</p>
                <Button 
                  onClick={handleBack}
                  className="mt-4 bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Breadcrumbs */}
          <Breadcrumb aria-label="Ticket breadcrumb" className="mb-6">
            <BreadcrumbItem href="/" icon={Home}>
              Home
            </BreadcrumbItem>
            <BreadcrumbItem href="/tickets">
              {user?.role === 'agent' ? 'My Tickets' : 'My Tickets'}
            </BreadcrumbItem>
            <BreadcrumbItem>
              #{ticketId}
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleBack}
                color="gray"
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ticket.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ticket #{ticketId}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Details Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {/* Status and Priority Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="status" value={ticket.status} showLabel />
                  <Badge variant="priority" value={ticket.priority} showLabel />
                  <Badge variant="severity" value={ticket.severity} showLabel />
                </div>

                {/* Tags Section */}
                {ticket.tagIds && ticket.tagIds.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <TagIcon className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ticket.tagIds.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 rounded border border-orange-200 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800"
                        >
                          <span className="text-[10px] opacity-60 mr-1">{tag.key}:</span>
                          <span className="text-xs">{tag.value}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agent Status Controls */}
                {canModifyTicket && ticket.status !== 'closed' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
                      Ticket Actions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ticket.status === 'new' && (
                        <Button
                          size="xs"
                          className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                          onClick={() => handleStatusUpdate('in_progress')}
                          disabled={updatingStatus}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Start Work
                        </Button>
                      )}
                      
                      {ticket.status === 'in_progress' && (
                        <>
                          <Button
                            size="xs"
                            className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                            onClick={() => handleStatusUpdate('waiting_for_customer')}
                            disabled={updatingStatus}
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Wait for Customer
                          </Button>
                          <Button
                            size="xs"
                            className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                            onClick={() => handleStatusUpdate('resolved')}
                            disabled={updatingStatus}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolve
                          </Button>
                        </>
                      )}
                      
                      {ticket.status === 'waiting_for_customer' && (
                        <Button
                          size="xs"
                          className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                          onClick={() => handleStatusUpdate('in_progress')}
                          disabled={updatingStatus}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Resume Work
                        </Button>
                      )}

                      {ticket.status === 'waiting_for_agent' && (
                        <Button
                          size="xs"
                          className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                          onClick={() => handleStatusUpdate('in_progress')}
                          disabled={updatingStatus}
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Resume Work
                        </Button>
                      )}

                      {(ticket.status === 'in_progress' || ticket.status === 'resolved') && (
                        <Button
                          size="xs"
                          className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                          onClick={() => setShowCloseForm(!showCloseForm)}
                          disabled={updatingStatus}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Close Ticket
                        </Button>
                      )}
                    </div>

                    {/* Close Ticket Form */}
                    {showCloseForm && (
                      <div className="mt-4 border-t border-blue-200 dark:border-blue-700 pt-4">
                        {/* ENHANCEMENT L1 AI CLOSING SUGGESTIONS - AI Suggestions Section */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              AI Closing Suggestions
                            </label>
                            <Button
                              size="xs"
                              className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                              onClick={handleGenerateClosingSuggestions}
                              disabled={generatingClosingSuggestions}
                            >
                              <Brain className="h-3 w-3 mr-1" />
                              {generatingClosingSuggestions ? 'Generating...' : 'Get AI Suggestions'}
                            </Button>
                          </div>

                          {/* Loading state */}
                          {generatingClosingSuggestions && (
                            <div className="flex items-center justify-center py-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-3">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                              <span className="ml-2 text-sm text-purple-700 dark:text-purple-300">
                                AI is analyzing the ticket for closing suggestions...
                              </span>
                            </div>
                          )}

                          {/* AI Suggestions Display */}
                          {showAISuggestions && closingSuggestions && !generatingClosingSuggestions && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-3">
                              <div className="flex items-center mb-3">
                                <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                                <h5 className="text-sm font-medium text-purple-900 dark:text-purple-200">
                                  AI-Generated Closing Suggestion
                                </h5>
                              </div>
                              
                              <div className="mb-3">
                                <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                                  <strong>Reason:</strong> {closingSuggestions.reason}
                                </p>
                                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-purple-200 dark:border-purple-700">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {closingSuggestions.comment}
                                  </p>
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                <Button
                                  size="xs"
                                  className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                                  onClick={() => handleApplyAISuggestion(closingSuggestions.comment)}
                                >
                                  Use This Comment
                                </Button>
                                <Button
                                  size="xs"
                                  color="gray"
                                  onClick={() => setShowAISuggestions(false)}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Closing Comment <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          value={closingComment}
                          onChange={(e) => setClosingComment(e.target.value)}
                          placeholder="Describe how the issue was resolved..."
                          rows={4}
                          className="w-full mb-3"
                          required
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="xs"
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                            onClick={handleCloseTicket}
                            disabled={!closingComment.trim() || updatingStatus}
                          >
                            {updatingStatus ? 'Closing...' : 'Close Ticket'}
                          </Button>
                          <Button
                            size="xs"
                            color="gray"
                            onClick={() => {
                              setShowCloseForm(false);
                              setClosingComment('');
                              setShowAISuggestions(false);
                              setClosingSuggestions(null);
                            }}
                            disabled={updatingStatus}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <RichTextEditor
                      content={convertLegacyContent(ticket.content)}
                      editable={false}
                      className="border-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Comments ({comments.length})
                  </h4>
                </div>
                
                {/* Comments List */}
                <div className="space-y-6 mb-8">
                  {comments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No comments yet</p>
                      <p className="text-sm">Be the first to add a comment!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-4">
                        <Avatar
                          img=""
                          alt={comment.user.name || comment.user.email}
                          size="md"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {comment.user.name || comment.user.email}
                            </span>
                            {comment.user.role && (
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                comment.user.role === 'agent' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {comment.user.role === 'agent' ? 'Agent' : 'Customer'}
                              </span>
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatFullDateTime(comment.created_at)}
                            </span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <RichTextEditor
                              content={convertLegacyContent(comment.content)}
                              editable={false}
                              className="border-none bg-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex space-x-4">
                    <Avatar
                      img=""
                      alt="You"
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Add a comment
                      </label>
                      <div className="mb-4">
                        <RichTextEditor
                          content={newComment}
                          onChange={setNewComment}
                          placeholder="Type your comment here..."
                          className="min-h-[140px]"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button
                          color="gray"
                          onClick={() => setNewComment(createEmptyRichText())}
                          disabled={!newComment.text.trim()}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                          onClick={handleAddComment}
                          disabled={!newComment.text.trim() || submittingComment}
                        >
                          {submittingComment ? 'Adding...' : 'Add Comment'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ticket Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ticket Information
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {formatFullDateTime(ticket.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Updated</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {formatFullDateTime(ticket.updatedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Reporter</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {ticket.userInfo?.name || ticket.userInfo?.email}
                    </dd>
                  </div>
                  {ticket.agentInfo && (
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400">Assigned to</dt>
                      <dd className="mt-1 text-gray-900 dark:text-white">
                        {ticket.agentInfo.name || ticket.agentInfo.email}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Category</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {ticket.category?.name} → {ticket.subCategory?.name}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}