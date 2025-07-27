'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal, ModalHeader, ModalBody, Button, Avatar } from 'flowbite-react';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { ticketsApi } from '../../../lib/api';
import { formatTimeAgo } from '../../../lib/utils';
import { Badge, LoadingSpinner } from '../../shared/components';
import { RichTextEditor } from '../../shared/components/RichTextEditor';
import type { Ticket, Comment, CreateComment, RichTextContent } from '../../shared/types';
import { createEmptyRichText, convertLegacyContent } from '../../../lib/utils';

interface TicketViewModalProps {
  ticketId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TicketViewModal({ ticketId, isOpen, onClose }: TicketViewModalProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  // const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState<RichTextContent>(createEmptyRichText());
  const [submittingComment, setSubmittingComment] = useState(false);

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
    } catch (error) {
      console.error('Failed to fetch ticket data:', error);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId && isOpen) {
      fetchTicketData();
    }
  }, [ticketId, isOpen, fetchTicketData]);

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
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleClose = () => {
    setTicket(null);
    setComments([]);
    setNewComment(createEmptyRichText());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal show={isOpen} onClose={handleClose} size="4xl" dismissible>
      <ModalHeader>
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {ticket?.title || 'Loading...'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              #{ticketId}
            </p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="p-0 max-h-[80vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner text="Loading ticket..." />
          </div>
        ) : ticket ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Ticket Details */}
            <div className="p-6">
              {/* Status and Priority Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="status" value={ticket.status} />
                <Badge variant="priority" value={ticket.priority} />
                <Badge variant="priority" value={ticket.severity} />
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-sm">
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="mt-1 text-gray-900 dark:text-white">{formatTimeAgo(ticket.created_at)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Updated</dt>
                  <dd className="mt-1 text-gray-900 dark:text-white">{formatTimeAgo(ticket.updated_at)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500 dark:text-gray-400">Reporter</dt>
                  <dd className="mt-1 text-gray-900 dark:text-white">{ticket.user_id}</dd>
                </div>
                {ticket.agent_id && (
                  <div>
                    <dt className="font-medium text-gray-500 dark:text-gray-400">Assigned to</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">{ticket.agent_id}</dd>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">SUMMARY</h4>
                <p className="text-gray-900 dark:text-white leading-relaxed">{ticket.description}</p>
              </div>

              {/* Content */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">DETAILED DESCRIPTION</h4>
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
            <div className="p-6">
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
                        alt={comment.user_id}
                        size="md"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {comment.user_id}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(comment.created_at)}
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
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Ticket not found</h3>
              <p className="text-sm">The requested ticket could not be loaded.</p>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}