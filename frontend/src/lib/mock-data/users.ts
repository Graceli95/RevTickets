import type { User } from '../../app/shared/types';

export const mockUsers: User[] = [
  {
    id: 'user_1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: 'user',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'user_2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'user',
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
  },
  {
    id: 'user_3',
    name: 'Mike Davis',
    email: 'mike.davis@company.com',
    role: 'user',
    createdAt: '2024-02-01T14:15:00Z',
    updatedAt: '2024-02-01T14:15:00Z',
  },
  {
    id: 'agent_1',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@support.com',
    role: 'agent',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'agent_2',
    name: 'Emily Chen',
    email: 'emily.chen@support.com',
    role: 'agent',
    createdAt: '2024-01-12T09:30:00Z',
    updatedAt: '2024-01-12T09:30:00Z',
  },
  {
    id: 'agent_3',
    name: 'David Wilson',
    email: 'david.wilson@support.com',
    role: 'agent',
    createdAt: '2024-01-14T11:00:00Z',
    updatedAt: '2024-01-14T11:00:00Z',
  },
  {
    id: 'agent_4',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@support.com',
    role: 'agent',
    createdAt: '2024-01-16T13:45:00Z',
    updatedAt: '2024-01-16T13:45:00Z',
  },
];

export const getCurrentUser = (): User => mockUsers[0]; // Default to John Smith