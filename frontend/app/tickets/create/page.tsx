'use client';

import { MainLayout } from '../../../src/app/shared/components';
import { CreateTicketForm } from '../../../src/app/features/tickets';

export default function CreateTicketPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Ticket</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Submit a new support request and we'll help you resolve it quickly
          </p>
        </div>
        
        <CreateTicketForm />
      </div>
    </MainLayout>
  );
}