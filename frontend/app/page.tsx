'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout, ProtectedRoute } from '../src/app/shared/components';
import { Ticket, Users, Clock, CheckCircle, TrendingUp, AlertCircle, Timer, Eye } from 'lucide-react';
import { ticketsApi } from '../src/lib/api';
import { formatTimeAgo } from '../src/lib/utils';
import { useAuth } from '../src/contexts/AuthContext';
import type { Ticket as TicketType, TicketStats } from '../src/app/shared/types';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect regular users to tickets page
    if (user && user.role !== 'agent') {
      router.replace('/tickets');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [statsData, ticketsData] = await Promise.all([
          ticketsApi.getStats(),
          ticketsApi.getAll({ status: 'new' })
        ]);
        
        setStats(statsData);
        setRecentTickets(ticketsData.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch dashboard data for agents
    if (user?.role === 'agent') {
      fetchDashboardData();
    }
  }, [user, router]);

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
              ))}
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Agent Dashboard</h1>
              <p className="text-blue-100 mt-1">
                Welcome back! Here&apos;s what&apos;s happening with your tickets.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-blue-100">
                {new Date().toLocaleDateString('en-US', { year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Tickets
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.total || 0}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        12%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Need Attention
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.new || 0}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-orange-600">
                        <Timer className="w-3 h-3 mr-0.5" />
                        Urgent
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      In Progress
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.in_progress || 0}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        18%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Resolved Today
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.closed || 0}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        8%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Tickets Requiring Attention
                </h3>
              </div>
              <div className="p-6">
                <div className="flow-root">
                  <ul className="-my-4 divide-y divide-gray-200 dark:divide-gray-700">
                    {recentTickets.map((ticket) => (
                      <li key={ticket.id} className="py-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-4 -mx-4 cursor-pointer transition-colors" onClick={() => router.push(`/tickets/${ticket.id}`)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              ticket.priority === 'critical' ? 'bg-red-500' :
                              ticket.priority === 'high' ? 'bg-orange-500' :
                              ticket.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {ticket.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">#{ticket.id}</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className={`text-xs font-medium ${
                                  ticket.priority === 'critical' ? 'text-red-600 dark:text-red-400' :
                                  ticket.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                  ticket.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                                </span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTimeAgo(ticket.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                              ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                ticket.status === 'new' ? 'bg-blue-500' :
                                ticket.status === 'in_progress' ? 'bg-yellow-500' :
                                'bg-gray-500'
                              }`}></div>
                              {ticket.status === 'new' ? 'New' :
                               ticket.status === 'in_progress' ? 'In Progress' :
                               ticket.status}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                    {recentTickets.length === 0 && (
                      <li className="py-8 text-center text-gray-500 dark:text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">All caught up!</p>
                        <p className="text-sm">No tickets requiring immediate attention.</p>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <button 
                  onClick={() => router.push('/tickets')}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-3" />
                  View All Tickets
                </button>
                <button 
                  onClick={() => router.push('/tickets?status=new')}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <AlertCircle className="w-4 h-4 mr-3" />
                  New Tickets ({stats?.new || 0})
                </button>
                <button 
                  onClick={() => router.push('/categories')}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Users className="w-4 h-4 mr-3" />
                  Manage Categories
                </button>
                <button 
                  onClick={() => router.push('/knowledge-base')}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Ticket className="w-4 h-4 mr-3" />
                  Knowledge Base
                </button>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Today&apos;s Summary
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tickets Closed</span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">{stats?.closed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">~2h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</span>
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">94%</span>
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
