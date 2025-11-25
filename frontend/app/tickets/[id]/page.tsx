'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, Button, Avatar, Textarea } from 'flowbite-react';
import { MessageCircle, AlertCircle, Edit3, CheckCircle2, XCircle, Home, Brain, Sparkles, Edit, Save, X, Clock, RotateCcw, Paperclip, Download, Eye, FileIcon, Plus, Upload } from 'lucide-react';
import Link from 'next/link';
import { MainLayout, ProtectedRoute, FileUpload } from '../../../src/app/shared/components';
import { LoadingSpinner } from '../../../src/app/shared/components';
import { RichTextEditor } from '../../../src/app/shared/components/RichTextEditor';
import { ticketsApi, filesApi } from '../../../src/lib/api';
import { formatFullDateTime, canEditComment, getEditTimeRemaining, canReopenTicket, getReopenTimeRemaining } from '../../../src/lib/utils';
import { useAuth } from '../../../src/contexts/AuthContext';
import type { Ticket, Comment, CreateComment, RichTextContent, TicketStatus, ClosingCommentsResponse, FileAttachment, FileAttachmentUpload } from '../../../src/app/shared/types';
import { createEmptyRichText, convertLegacyContent } from '../../../src/lib/utils';

export default function TicketDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  
  // File preview states
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loadingPreview, setLoadingPreview] = useState(false);
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

  // ENHANCEMENT L1 COMMENT EDITING - Edit state management
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<RichTextContent>(createEmptyRichText());
  const [updatingComment, setUpdatingComment] = useState(false);

  // ENHANCEMENT L2 FILE ATTACHMENTS - Add files to existing tickets
  const [isAddingFiles, setIsAddingFiles] = useState(false);
  const [newAttachments, setNewAttachments] = useState<FileAttachmentUpload[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // ENHANCEMENT L1 TICKET REOPENING - Reopen state management
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [reopeningTicket, setReopeningTicket] = useState(false);

  // ENHANCEMENT L1 AI TICKET SUMMARY - AI summary state management
  const [summary, setSummary] = useState<string | null>(null);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const fetchTicketData = useCallback(async () => {
    if (!ticketId) return;

    try {
      setLoading(true);
      const [ticketData, commentsData] = await Promise.all([
        ticketsApi.getById(ticketId),
        ticketsApi.getComments(ticketId),
      ]);
      setTicket(ticketData);
      setComments(commentsData);
      
      // ENHANCEMENT L2: FILE ATTACHMENTS - Fetch file attachments for the ticket
      try {
        setLoadingAttachments(true);
        const attachmentsData = await filesApi.getTicketFiles(ticketId);
        setAttachments(attachmentsData);
      } catch (error) {
        console.error('Failed to fetch file attachments:', error);
        setAttachments([]);
      } finally {
        setLoadingAttachments(false);
      }
      
      // ENHANCEMENT L1 AI TICKET SUMMARY - Initialize summary state from ticket data
      if (ticketData.aiSummary) {
        setSummary(ticketData.aiSummary);
        setSummaryGeneratedAt(ticketData.summaryGeneratedAt || null);
        setShowSummary(true);
      }
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

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

  // ENHANCEMENT L2: FILE ATTACHMENTS - File download handler
  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      const blob = await filesApi.download(fileId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // ENHANCEMENT L2: FILE ATTACHMENTS - Secure file preview with authentication
  const handlePreviewFile = async (file: FileAttachment) => {
    setPreviewFile(file);
    setShowPreview(true);
    setLoadingPreview(true);
    
    try {
      // Fetch file as blob with authentication for preview
      const blob = await filesApi.download(file.id);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to load file for preview:', error);
      setPreviewUrl(''); // This will trigger the error state in the modal
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    // Clean up the object URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setPreviewFile(null);
    setShowPreview(false);
    setLoadingPreview(false);
  };

  // ENHANCEMENT L2 FILE ATTACHMENTS - Add files to existing ticket
  const handleAddFilesToTicket = async () => {
    if (newAttachments.length === 0) return;

    try {
      setUploadingFiles(true);
      
      // Upload each file and collect file IDs
      const uploadedFileIds: string[] = [];
      
      for (let i = 0; i < newAttachments.length; i++) {
        const attachment = newAttachments[i];
        if (attachment.file && !attachment.uploaded) {
          try {
            // Upload file with progress tracking
            const uploadResponse = await filesApi.upload(attachment.file, (progress) => {
              setNewAttachments(prev => prev.map((att, index) => 
                index === i ? { ...att, uploadProgress: progress } : att
              ));
            });

            uploadedFileIds.push(uploadResponse.id);
            
            // Mark as uploaded
            setNewAttachments(prev => prev.map((att, index) => 
              index === i ? { 
                ...att, 
                uploaded: true, 
                uploadProgress: 100,
                id: uploadResponse.id
              } : att
            ));
          } catch (error) {
            console.error(`Failed to upload file ${attachment.name}:`, error);
            setNewAttachments(prev => prev.map((att, index) => 
              index === i ? { 
                ...att, 
                uploadError: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
              } : att
            ));
            throw error; // Stop processing on first error
          }
        } else if (attachment.id) {
          uploadedFileIds.push(attachment.id);
        }
      }
      
      // Attach all uploaded files to the ticket
      if (uploadedFileIds.length > 0) {
        await filesApi.attachToTicket(ticketId, uploadedFileIds);
        
        // Refresh the attachments list
        const updatedAttachments = await filesApi.getTicketFiles(ticketId);
        setAttachments(updatedAttachments);
      }
      
      // Reset state
      setNewAttachments([]);
      setIsAddingFiles(false);
      
    } catch (error) {
      console.error('Failed to add attachments:', error);
      alert('Failed to add attachments. Please try again.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleCancelAddFiles = () => {
    setNewAttachments([]);
    setIsAddingFiles(false);
  };

  // Check if current user can add files to this ticket
  const canAddFiles = ticket && user && (
    ticket.userInfo?.id === user.id || // Ticket creator
    (user.role === 'agent' && ticket.agentInfo?.id === user.id) // Assigned agent
  );

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

  // ENHANCEMENT L1 COMMENT EDITING - Comment edit functions
  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(convertLegacyContent(comment.content));
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent(createEmptyRichText());
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editingContent.text.trim()) return;

    try {
      setUpdatingComment(true);
      await ticketsApi.updateComment(editingCommentId, {
        content: editingContent
      });

      // Update the comment in local state
      setComments(comments.map(comment => 
        comment.id === editingCommentId 
          ? { 
              ...comment, 
              content: editingContent, 
              updatedAt: new Date().toISOString(),
              edited: true,
              edit_count: (comment.edit_count || 0) + 1
            }
          : comment
      ));

      // Reset edit state
      handleCancelEdit();
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setUpdatingComment(false);
    }
  };

  // ENHANCEMENT L1 TICKET REOPENING - Reopen ticket functionality
  const handleReopenTicket = async () => {
    if (!ticketId || !ticket) return;

    try {
      setReopeningTicket(true);
      await ticketsApi.reopenTicket(ticketId);
      
      // Update local ticket state
      setTicket({ ...ticket, status: 'new' });
      setShowReopenConfirm(false);
    } catch (error) {
      console.error('Failed to reopen ticket:', error);
    } finally {
      setReopeningTicket(false);
    }
  };

  // ENHANCEMENT L1 AI TICKET SUMMARY - Generate summary function
  const handleGenerateSummary = async () => {
    if (!ticketId) return;

    try {
      setGeneratingSummary(true);
      const response = await ticketsApi.generateSummary(ticketId);
      setSummary(response.summary);
      setSummaryGeneratedAt(new Date().toISOString());
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setGeneratingSummary(false);
    }
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
                <Link href="/tickets">
                  <Button className="mt-4 bg-orange-600 hover:bg-orange-700 focus:ring-orange-500">
                    Go Back
                  </Button>
                </Link>
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
            <BreadcrumbItem>
              <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link href="/tickets" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                {user?.role === 'agent' ? 'Agent Dashboard' : 'My Tickets'}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              Ticket #{ticketId}
            </BreadcrumbItem>
          </Breadcrumb>

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {ticket.title}
                </h1>
                <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                  <span>#{ticketId}</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>Created by {ticket.userInfo?.name || ticket.userInfo?.email}</span>
                  {ticket.agentInfo && (
                    <>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>Assigned to {ticket.agentInfo.name || ticket.agentInfo.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Status Workflow */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ticket Progress
                  </h3>
                </div>
                <div className="p-6">
                  <div className="relative">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between relative mb-8">
                      {[
                        { status: 'new', label: 'New' },
                        { status: 'in_progress', label: 'In Progress' },
                        { status: 'waiting_for_customer', label: 'Awaiting Customer' },
                        { status: 'waiting_for_agent', label: 'Awaiting Agent' },
                        { status: 'resolved', label: 'Resolved' },
                        { status: 'closed', label: 'Closed' }
                      ].map((step, index, array) => {
                        const currentIndex = array.findIndex(s => s.status === ticket.status);
                        const isCompleted = index < currentIndex;
                        const isCurrent = step.status === ticket.status;
                        
                        return (
                          <div key={step.status} className="flex flex-col items-center relative z-10">
                            {/* Step Circle */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              isCompleted 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : isCurrent
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-white border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600'
                            }`}>
                              {isCompleted ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="text-xs font-bold">{index + 1}</span>
                              )}
                            </div>
                            
                            {/* Step Label */}
                            <div className={`mt-2 text-xs font-medium text-center max-w-20 ${
                              isCompleted || isCurrent 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {step.label}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Progress Line */}
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700 -z-0">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-500 ease-out"
                          style={{
                            width: `${(([
                              'new', 'in_progress', 'waiting_for_customer', 'waiting_for_agent', 'resolved', 'closed'
                            ].findIndex(s => s === ticket.status)) / 5) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 text-center bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <span className="font-medium">Current Status:</span>{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {ticket.status === 'new' ? 'New Ticket - Awaiting Assignment' :
                       ticket.status === 'in_progress' ? 'In Progress - Being Worked On' :
                       ticket.status === 'waiting_for_customer' ? 'Waiting for Your Response' :
                       ticket.status === 'waiting_for_agent' ? 'Waiting for Agent Response' :
                       ticket.status === 'resolved' ? 'Resolved - Ready for Review' :
                       ticket.status === 'closed' ? 'Closed - Completed' : ticket.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Details Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                {/* Status and Priority Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">STATUS</div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        ticket.status === 'new' ? 'bg-blue-500' :
                        ticket.status === 'in_progress' ? 'bg-yellow-500' :
                        ticket.status === 'waiting_for_customer' ? 'bg-orange-500' :
                        ticket.status === 'waiting_for_agent' ? 'bg-purple-500' :
                        ticket.status === 'resolved' ? 'bg-green-500' :
                        ticket.status === 'closed' ? 'bg-gray-500' : 'bg-gray-400'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        ticket.status === 'new' ? 'text-blue-700 dark:text-blue-300' :
                        ticket.status === 'in_progress' ? 'text-yellow-700 dark:text-yellow-300' :
                        ticket.status === 'waiting_for_customer' ? 'text-orange-700 dark:text-orange-300' :
                        ticket.status === 'waiting_for_agent' ? 'text-purple-700 dark:text-purple-300' :
                        ticket.status === 'resolved' ? 'text-green-700 dark:text-green-300' :
                        ticket.status === 'closed' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600'
                      }`}>
                        {ticket.status === 'new' ? 'New' :
                         ticket.status === 'in_progress' ? 'In Progress' :
                         ticket.status === 'waiting_for_customer' ? 'Waiting for Customer' :
                         ticket.status === 'waiting_for_agent' ? 'Waiting for Agent' :
                         ticket.status === 'resolved' ? 'Resolved' :
                         ticket.status === 'closed' ? 'Closed' : ticket.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">PRIORITY</div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        ticket.priority === 'critical' ? 'bg-red-500' :
                        ticket.priority === 'high' ? 'bg-orange-500' :
                        ticket.priority === 'medium' ? 'bg-yellow-500' :
                        ticket.priority === 'low' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        ticket.priority === 'critical' ? 'text-red-700 dark:text-red-300' :
                        ticket.priority === 'high' ? 'text-orange-700 dark:text-orange-300' :
                        ticket.priority === 'medium' ? 'text-yellow-700 dark:text-yellow-300' :
                        ticket.priority === 'low' ? 'text-green-700 dark:text-green-300' : 'text-gray-600'
                      }`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ENHANCEMENT L1 TICKET REOPENING - Reopen ticket section */}
                {user?.role === 'user' && ticket?.userInfo?.id === user.id && 
                 (ticket.status === 'closed' || ticket.status === 'resolved') && 
                 ticket.closedAt && canReopenTicket(ticket.closedAt) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                          Ticket can be reopened
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {getReopenTimeRemaining(ticket.closedAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                        onClick={() => setShowReopenConfirm(true)}
                        disabled={reopeningTicket}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reopen Ticket
                      </Button>
                    </div>
                  </div>
                )}

                {/* ENHANCEMENT L1 AI TICKET SUMMARY - AI Summary section for agents */}
                {user?.role === 'agent' && ticket?.status !== 'closed' && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-purple-600" />
                        <h4 className="text-sm font-medium text-purple-900 dark:text-purple-200">
                          AI Ticket Summary
                        </h4>
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                        onClick={handleGenerateSummary}
                        disabled={generatingSummary}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {generatingSummary ? 'Generating...' : (summary ? 'Regenerate Summary' : 'Generate Summary')}
                      </Button>
                    </div>

                    {/* Loading state */}
                    {generatingSummary && (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-3 text-sm text-purple-700 dark:text-purple-300">
                          AI is analyzing the ticket conversation...
                        </span>
                      </div>
                    )}

                    {/* Summary display */}
                    {showSummary && summary && !generatingSummary && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                            Summary Generated
                          </h5>
                          {summaryGeneratedAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFullDateTime(summaryGeneratedAt)}
                            </span>
                          )}
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {summary}
                          </p>
                        </div>
                        <div className="flex justify-end mt-3">
                          <Button
                            size="xs"
                            color="gray"
                            onClick={() => setShowSummary(false)}
                          >
                            Hide Summary
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Description</h4>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <RichTextEditor
                      content={convertLegacyContent(ticket.content)}
                      editable={false}
                      className="border-none bg-transparent"
                    />
                  </div>
                </div>

                {/* ENHANCEMENT L2: FILE ATTACHMENTS - File Attachments Section with Add Capability */}
                {(attachments.length > 0 || loadingAttachments || canAddFiles) && (
                  <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Paperclip className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          File Attachments ({attachments.length})
                        </h4>
                      </div>
                      
                      {/* Add Attachment Button - Only show if user can add files and not already adding */}
                      {canAddFiles && !isAddingFiles && (
                        <Button
                          size="sm"
                          onClick={() => setIsAddingFiles(true)}
                          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
                          disabled={uploadingFiles}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Files
                        </Button>
                      )}
                    </div>
                    
                    {loadingAttachments ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading attachments...</span>
                      </div>
                    ) : (
                      <>
                        {attachments.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {attachments.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
                              >
                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                  <div className="flex-shrink-0">
                                    {file.content_type.startsWith('image/') ? (
                                      <div className="h-8 w-8 bg-green-100 dark:bg-green-900/20 rounded flex items-center justify-center">
                                        <span className="text-green-600 dark:text-green-400 text-xs">IMG</span>
                                      </div>
                                    ) : file.content_type === 'application/pdf' ? (
                                      <div className="h-8 w-8 bg-red-100 dark:bg-red-900/20 rounded flex items-center justify-center">
                                        <span className="text-red-600 dark:text-red-400 text-xs">PDF</span>
                                      </div>
                                    ) : (
                                      <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 text-xs">DOC</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {file.filename}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {filesApi.formatFileSize(file.size)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  {(file.content_type.startsWith('image/') || file.content_type === 'application/pdf') && (
                                    <Button
                                      size="xs"
                                      color="gray"
                                      onClick={() => handlePreviewFile(file)}
                                      title={`Preview ${file.content_type.startsWith('image/') ? 'image' : 'PDF'}`}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="xs"
                                    className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
                                    onClick={() => handleDownloadFile(file.id, file.filename)}
                                    title="Download file"
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                            <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No attachments yet</p>
                          </div>
                        )}

                        {/* File Upload Interface - Show when adding files */}
                        {isAddingFiles && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Add New Attachments
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Upload files to attach to this ticket (max 5MB per file, 5 files total)
                              </p>
                            </div>
                            
                            <FileUpload
                              attachments={newAttachments}
                              onAttachmentsChange={setNewAttachments}
                              disabled={uploadingFiles}
                              className="w-full"
                            />
                            
                            <div className="flex gap-2 mt-3">
                              <Button
                                onClick={handleAddFilesToTicket}
                                disabled={uploadingFiles || newAttachments.length === 0}
                                className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
                              >
                                {uploadingFiles ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Files
                                  </>
                                )}
                              </Button>
                              <Button
                                color="gray"
                                onClick={handleCancelAddFiles}
                                disabled={uploadingFiles}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {/* Comments Header */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Activity & Comments
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({comments.length})</span>
                  </div>
                </div>
                
                {/* Comments List */}
                <div className="px-6 py-4">
                  <div className="space-y-6 mb-8">
                    {comments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No comments yet</p>
                        <p className="text-sm">Be the first to add a comment!</p>
                      </div>
                    ) : (
                      comments.map((comment) => {
                        const isEditing = editingCommentId === comment.id;
                        const canEdit = user && canEditComment(comment.createdAt, user.id, comment.user.id);
                        const timeRemaining = getEditTimeRemaining(comment.createdAt);

                        return (
                          <div key={comment.id} className="flex space-x-4 pb-6 border-b border-gray-100 dark:border-gray-700 last:border-b-0 last:pb-0">
                          <Avatar
                            img=""
                            alt={comment.user.name || comment.user.email}
                            size="md"
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
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
                                  {formatFullDateTime(comment.createdAt)}
                                </span>
                                {/* ENHANCEMENT L1 COMMENT EDITING - Show edited indicator */}
                                {comment.edited && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                    (edited)
                                  </span>
                                )}
                              </div>
                              
                              {/* ENHANCEMENT L1 COMMENT EDITING - Edit button and time remaining */}
                              {canEdit && !isEditing && (
                                <div className="flex items-center space-x-2">
                                  {timeRemaining && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {timeRemaining}
                                    </span>
                                  )}
                                  <Button
                                    size="xs"
                                    onClick={() => handleStartEdit(comment)}
                                    className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* ENHANCEMENT L1 COMMENT EDITING - Editable content */}
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                                  <RichTextEditor
                                    content={editingContent}
                                    onChange={setEditingContent}
                                    placeholder="Edit your comment..."
                                    className="min-h-[100px]"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex space-x-2">
                                    <Button
                                      size="xs"
                                      className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                                      onClick={handleSaveEdit}
                                      disabled={!editingContent.text.trim() || updatingComment}
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      {updatingComment ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button
                                      size="xs"
                                      color="gray"
                                      onClick={handleCancelEdit}
                                      disabled={updatingComment}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                  </div>
                                  {timeRemaining && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {timeRemaining}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <RichTextEditor
                                  content={convertLegacyContent(comment.content)}
                                  editable={false}
                                  className="border-none bg-transparent"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
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
                            className="min-h-[140px] border-2 border-gray-200 dark:border-gray-600 rounded-lg"
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
            </div>

            {/* Actions Sidebar */}
            <div className="space-y-6">
              {/* Action Buttons Card */}
              {canModifyTicket && ticket.status !== 'closed' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Actions
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {ticket.status === 'new' && (
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 justify-start"
                        onClick={() => handleStatusUpdate('in_progress')}
                        disabled={updatingStatus}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Start Work
                      </Button>
                    )}
                    
                    {ticket.status === 'in_progress' && (
                      <>
                        <Button
                          size="sm"
                          className="w-full bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 justify-start"
                          onClick={() => handleStatusUpdate('waiting_for_customer')}
                          disabled={updatingStatus}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Wait for Customer
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 focus:ring-green-500 justify-start"
                          onClick={() => handleStatusUpdate('resolved')}
                          disabled={updatingStatus}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </Button>
                      </>
                    )}
                    
                    {(ticket.status === 'waiting_for_customer' || ticket.status === 'waiting_for_agent') && (
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 justify-start"
                        onClick={() => handleStatusUpdate('in_progress')}
                        disabled={updatingStatus}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Resume Work
                      </Button>
                    )}

                    {(ticket.status === 'in_progress' || ticket.status === 'resolved') && (
                      <Button
                        size="sm"
                        className="w-full bg-red-600 hover:bg-red-700 focus:ring-red-500 justify-start"
                        onClick={() => setShowCloseForm(!showCloseForm)}
                        disabled={updatingStatus}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Close Ticket
                      </Button>
                    )}
                  </div>

                  {/* Close Ticket Form */}
                  {showCloseForm && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
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

              {/* Ticket Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Details
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400 mb-1">Created</dt>
                      <dd className="text-gray-900 dark:text-white">
                        {formatFullDateTime(ticket.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400 mb-1">Updated</dt>
                      <dd className="text-gray-900 dark:text-white">
                        {formatFullDateTime(ticket.updatedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400 mb-1">Reporter</dt>
                      <dd className="text-gray-900 dark:text-white">
                        {ticket.userInfo?.name || ticket.userInfo?.email}
                      </dd>
                    </div>
                    {ticket.agentInfo && (
                      <div>
                        <dt className="font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned to</dt>
                        <dd className="text-gray-900 dark:text-white">
                          {ticket.agentInfo.name || ticket.agentInfo.email}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="font-medium text-gray-500 dark:text-gray-400 mb-1">Category</dt>
                      <dd className="text-gray-900 dark:text-white">
                        {ticket.category?.name} → {ticket.subCategory?.name}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ENHANCEMENT L2: FILE ATTACHMENTS - Inline File Preview Modal */}
        {showPreview && previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Eye className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {previewFile.filename}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {filesApi.formatFileSize(previewFile.size)} • {previewFile.content_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                    onClick={() => handleDownloadFile(previewFile.id, previewFile.filename)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    color="gray"
                    className="p-2"
                    onClick={closePreview}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4 max-h-[calc(90vh-120px)] overflow-auto">
                {loadingPreview ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Loading preview...</span>
                  </div>
                ) : !previewUrl ? (
                  <div className="text-center py-12 text-red-500 dark:text-red-400">
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Failed to load preview</p>
                      <p className="text-sm mt-1">Try downloading the file instead</p>
                    </div>
                  </div>
                ) : previewFile.content_type.startsWith('image/') ? (
                  <div className="flex justify-center">
                    <img
                      src={previewUrl}
                      alt={previewFile.filename}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                ) : previewFile.content_type === 'application/pdf' ? (
                  <div className="w-full h-96">
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0 rounded-lg"
                      title={`PDF Preview: ${previewFile.filename}`}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <FileIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Preview not available for this file type</p>
                      <p className="text-sm mt-1">Please download the file to view it</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ENHANCEMENT L1 TICKET REOPENING - Reopen confirmation modal */}
        {showReopenConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <RotateCcw className="h-5 w-5 mr-2 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Reopen Ticket
                  </h3>
                </div>
                <Button
                  color="gray"
                  className="p-1"
                  onClick={() => setShowReopenConfirm(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Body */}
              <div className="p-6 space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Are you sure you want to reopen this ticket? This will change the status to &quot;New&quot; and the ticket will be available for agent assignment again.
                </p>
                {ticket?.closedAt && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Time remaining:</strong> {getReopenTimeRemaining(ticket.closedAt)}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      After this period expires, the ticket cannot be reopened.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  color="gray"
                  onClick={() => setShowReopenConfirm(false)}
                  disabled={reopeningTicket}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                  onClick={handleReopenTicket}
                  disabled={reopeningTicket}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {reopeningTicket ? 'Reopening...' : 'Reopen Ticket'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  );
}