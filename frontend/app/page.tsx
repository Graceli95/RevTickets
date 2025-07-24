'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '../src/app/shared/components';
import { StatsCard } from '../src/app/features/dashboard';
import { Badge } from '../src/app/shared/components/ui';
import { Ticket, Users, Clock, CheckCircle } from 'lucide-react';
import { ticketsApi } from '../src/lib/api';
import { formatTimeAgo } from '../src/lib/utils';
import type { Ticket as TicketType, TicketStats } from '../src/app/shared/types';

export default function Home() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, ticketsData] = await Promise.all([
          ticketsApi.getStats(),
          ticketsApi.getAll({ status: 'open' })
        ]);
        
        setStats(statsData);
        setRecentTickets(ticketsData.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
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
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Welcome to your ticketing system dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Tickets"
            value={stats?.total || 0}
            icon={Ticket}
            change={{ value: "+12%", trend: "up" }}
          />
          <StatsCard
            title="Open Tickets"
            value={stats?.open || 0}
            icon={Clock}
            change={{ value: "-5%", trend: "down" }}
          />
          <StatsCard
            title="In Progress"
            value={stats?.in_progress || 0}
            icon={CheckCircle}
            change={{ value: "+18%", trend: "up" }}
          />
          <StatsCard
            title="Resolved"
            value={stats?.closed || 0}
            icon={Users}
            change={{ value: "+3%", trend: "up" }}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Recent Tickets
              </h3>
              <div className="mt-6 flow-root">
                <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentTickets.map((ticket) => (
                    <li key={ticket.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {ticket.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            #{ticket.id} • {ticket.priority} Priority • {formatTimeAgo(ticket.createdAt)}
                          </p>
                        </div>
                        <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                          <Badge variant="status" value={ticket.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                  {recentTickets.length === 0 && (
                    <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                      No recent tickets found
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Quick Actions
              </h3>
              <div className="mt-6 grid grid-cols-1 gap-4">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Create New Ticket
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  View All Tickets
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Manage Categories
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
