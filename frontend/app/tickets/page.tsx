'use client';

import { MainLayout } from '../../src/app/shared/components';
import { TicketsList } from '../../src/app/features/tickets';

export default function TicketsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">My Tickets</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage all your support tickets
          </p>
        </div>
        
        <TicketsList />
      </div>
    </MainLayout>
  );
}