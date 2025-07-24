'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Table, TableHead, TableHeadCell, TableRow, TableCell, TableBody} from 'flowbite-react';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { ticketsApi } from '../../../lib/api';
import { formatTimeAgo } from '../../../lib/utils';
import { Badge } from '../../shared/components/ui';
import { LoadingSpinner } from '../../shared/components';
import { TicketViewModal } from './TicketViewModal';
import type { Ticket } from '../../shared/types';

export function TicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (priorityFilter !== 'all') {  
        params.priority = priorityFilter;
      }
      
      const data = await ticketsApi.getAll(params);
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTickets();
      return;
    }

    try {
      setLoading(true);
      const params: any = { q: searchQuery };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }
      
      const data = await ticketsApi.search(params);
      setTickets(data);
    } catch (error) {
      console.error('Failed to search tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTicketClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTicketId(null);
  };

  if (loading) {
    return <LoadingSpinner text="Loading tickets..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-1 items-center space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tickets..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <Button
            color="gray"
            onClick={handleSearch}
            className="px-4"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_agent">Waiting for Agent</option>
            <option value="waiting_for_customer">Waiting for Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <Link href="/tickets/create">
            <Button color="blue">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* Tickets Table */}
      <Card>
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No tickets found</h3>
              <p className="text-sm">
                {searchQuery ? 'Try adjusting your search or filters' : 'Create your first ticket to get started'}
              </p>
            </div>
            {!searchQuery && (
              <Link href="/tickets/create">
                <Button color="blue" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Ticket
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Ticket</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Priority</TableHeadCell>
                  <TableHeadCell>Created</TableHeadCell>
                  <TableHeadCell>Updated</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      <div>
                        <button
                          onClick={() => handleTicketClick(ticket.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-left"
                        >
                          <div className="font-medium">{ticket.title}</div>
                        </button>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          #{ticket.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="status" value={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="priority" value={ticket.priority} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(ticket.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(ticket.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleTicketClick(ticket.id)}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                      >
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Results Summary */}
      {tickets.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          {searchQuery && ` matching "${searchQuery}"`}
          {(statusFilter !== 'all' || priorityFilter !== 'all') && ' with applied filters'}
        </div>
      )}

      {/* Ticket View Modal */}
      <TicketViewModal
        ticketId={selectedTicketId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}