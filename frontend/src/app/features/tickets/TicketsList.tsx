'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Table, TableHead, TableHeadCell, TableRow, TableCell, TableBody, Pagination } from 'flowbite-react';
import { Plus, Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ticketsApi } from '../../../lib/api';
import { formatFullDateTime } from '../../../lib/utils';
import { Badge } from '../../shared/components/ui';
import { LoadingSpinner } from '../../shared/components';
import { TicketViewModal } from './TicketViewModal';
import type { Ticket } from '../../shared/types';

type SortField = 'title' | 'status' | 'priority' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

export function TicketsList() {
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    applyFiltersAndSorting();
  }, [allTickets, searchQuery, sortField, sortDirection, currentPage]);

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
      setAllTickets(data);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSorting = () => {
    let filtered = [...allTickets];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date fields
      if (sortField === 'createdAt' || sortField === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      // Handle priority with importance order
      else if (sortField === 'priority') {
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        aValue = priorityOrder[aValue as keyof typeof priorityOrder] || 0;
        bValue = priorityOrder[bValue as keyof typeof priorityOrder] || 0;
      }
      // Handle status with workflow order
      else if (sortField === 'status') {
        const statusOrder = { 
          'new': 1, 
          'open': 2, 
          'assigned': 3, 
          'in_progress': 4, 
          'waiting_for_customer': 5, 
          'waiting_for_agent': 6, 
          'resolved': 7, 
          'closed': 8 
        };
        aValue = statusOrder[aValue as keyof typeof statusOrder] || 0;
        bValue = statusOrder[bValue as keyof typeof statusOrder] || 0;
      }
      // Handle string fields
      else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTickets = filtered.slice(startIndex, endIndex);

    setTickets(paginatedTickets);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
    applyFiltersAndSorting();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc direction
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
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
            onClick={handleSearch}
            className="bg-orange-600 px-4 hover:bg-orange-700 focus:ring-orange-500 text-white"
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
            <Button className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500">
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
                <Button className="mt-4 bg-orange-600 hover:bg-orange-700 focus:ring-orange-500">
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
                  <TableHeadCell>
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center space-x-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <span>Ticket</span>
                      {getSortIcon('title')}
                    </button>
                  </TableHeadCell>
                  <TableHeadCell>
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span>Status</span>
                      {getSortIcon('status')}
                    </button>
                  </TableHeadCell>
                  <TableHeadCell>
                    <button
                      onClick={() => handleSort('priority')}
                      className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span>Priority</span>
                      {getSortIcon('priority')}
                    </button>
                  </TableHeadCell>
                  <TableHeadCell>
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span>Created</span>
                      {getSortIcon('createdAt')}
                    </button>
                  </TableHeadCell>
                  <TableHeadCell>
                    <button
                      onClick={() => handleSort('updatedAt')}
                      className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span>Updated</span>
                      {getSortIcon('updatedAt')}
                    </button>
                  </TableHeadCell>
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
                      <div className="whitespace-nowrap">
                        {formatFullDateTime(ticket.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                      <div className="whitespace-nowrap">
                        {formatFullDateTime(ticket.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="xs"
                        className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 text-white"
                        onClick={() => handleTicketClick(ticket.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination and Results Summary */}
      {allTickets.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {(() => {
              let filtered = [...allTickets];
              
              // Apply search filter for count
              if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                filtered = filtered.filter(ticket => 
                  ticket.title.toLowerCase().includes(query) ||
                  ticket.description.toLowerCase().includes(query) ||
                  ticket.content.toLowerCase().includes(query)
                );
              }
              
              const totalFiltered = filtered.length;
              const startIndex = (currentPage - 1) * itemsPerPage + 1;
              const endIndex = Math.min(currentPage * itemsPerPage, totalFiltered);
              
              if (totalFiltered === 0) {
                return 'No tickets found';
              }
              
              return (
                <>
                  Showing {startIndex}-{endIndex} of {totalFiltered} ticket{totalFiltered !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                  {(statusFilter !== 'all' || priorityFilter !== 'all') && ' with applied filters'}
                </>
              );
            })()}
          </div>
          
          {(() => {
            let filtered = [...allTickets];
            
            // Apply search filter for pagination
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase();
              filtered = filtered.filter(ticket => 
                ticket.title.toLowerCase().includes(query) ||
                ticket.description.toLowerCase().includes(query) ||
                ticket.content.toLowerCase().includes(query)
              );
            }
            
            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            
            return totalPages > 1 ? (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                showIcons
              />
            ) : null;
          })()}
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