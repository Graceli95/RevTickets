import type { Category, SubCategory, Tag } from '../../app/shared/types';

export const mockTags: Tag[] = [
  { key: 'priority', value: 'high' },
  { key: 'priority', value: 'medium' },
  { key: 'priority', value: 'low' },
  { key: 'priority', value: 'critical' },
  { key: 'department', value: 'IT' },
  { key: 'department', value: 'HR' },
  { key: 'department', value: 'Finance' },
  { key: 'department', value: 'Operations' },
  { key: 'type', value: 'bug' },
  { key: 'type', value: 'feature' },
  { key: 'type', value: 'support' },
  { key: 'type', value: 'question' },
  { key: 'urgency', value: 'urgent' },
  { key: 'urgency', value: 'normal' },
  { key: 'platform', value: 'web' },
  { key: 'platform', value: 'mobile' },
  { key: 'platform', value: 'desktop' },
];

export const mockCategories: Category[] = [
  {
    id: 'cat_1',
    name: 'Technical Support',
    description: 'Issues related to software, hardware, and technical problems',
    tags: [
      { key: 'department', value: 'IT' },
      { key: 'type', value: 'support' },
    ],
  },
  {
    id: 'cat_2',
    name: 'Account Management',
    description: 'User account issues, password resets, and access problems',
    tags: [
      { key: 'department', value: 'IT' },
      { key: 'type', value: 'support' },
    ],
  },
  {
    id: 'cat_3',
    name: 'Bug Reports',
    description: 'Software bugs and system errors that need fixing',
    tags: [
      { key: 'department', value: 'IT' },
      { key: 'type', value: 'bug' },
    ],
  },
  {
    id: 'cat_4',
    name: 'Feature Requests',
    description: 'Requests for new features or enhancements to existing functionality',
    tags: [
      { key: 'department', value: 'IT' },
      { key: 'type', value: 'feature' },
    ],
  },
  {
    id: 'cat_5',
    name: 'HR Inquiries',
    description: 'Human resources related questions and requests',
    tags: [
      { key: 'department', value: 'HR' },
      { key: 'type', value: 'question' },
    ],
  },
  {
    id: 'cat_6',
    name: 'Finance & Billing',
    description: 'Payment issues, billing questions, and financial matters',
    tags: [
      { key: 'department', value: 'Finance' },
      { key: 'type', value: 'support' },
    ],
  },
];

export const mockSubCategories: SubCategory[] = [
  // Technical Support subcategories
  {
    id: 'subcat_1',
    categoryId: 'cat_1',
    name: 'Hardware Issues',
    description: 'Problems with physical equipment and devices',
  },
  {
    id: 'subcat_2',
    categoryId: 'cat_1',
    name: 'Software Issues',
    description: 'Problems with applications and software functionality',
  },
  {
    id: 'subcat_3',
    categoryId: 'cat_1',
    name: 'Network Connectivity',
    description: 'Internet, VPN, and network-related problems',
  },
  {
    id: 'subcat_4',
    categoryId: 'cat_1',
    name: 'Email & Communication',
    description: 'Email setup, delivery issues, and communication tools',
  },

  // Account Management subcategories
  {
    id: 'subcat_5',
    categoryId: 'cat_2',
    name: 'Password Reset',
    description: 'Password recovery and reset requests',
  },
  {
    id: 'subcat_6',
    categoryId: 'cat_2',
    name: 'Account Access',
    description: 'Login issues and account permissions',
  },
  {
    id: 'subcat_7',
    categoryId: 'cat_2',
    name: 'Profile Updates',
    description: 'Changes to user profile information',
  },

  // Bug Reports subcategories
  {
    id: 'subcat_8',
    categoryId: 'cat_3',
    name: 'UI/UX Bugs',
    description: 'User interface and experience related bugs',
  },
  {
    id: 'subcat_9',
    categoryId: 'cat_3',
    name: 'Performance Issues',
    description: 'Slow loading, crashes, and performance problems',
  },
  {
    id: 'subcat_10',
    categoryId: 'cat_3',
    name: 'Data Issues',
    description: 'Problems with data display, saving, or synchronization',
  },

  // Feature Requests subcategories
  {
    id: 'subcat_11',
    categoryId: 'cat_4',
    name: 'New Features',
    description: 'Requests for completely new functionality',
  },
  {
    id: 'subcat_12',
    categoryId: 'cat_4',
    name: 'Enhancements',
    description: 'Improvements to existing features',
  },

  // HR Inquiries subcategories
  {
    id: 'subcat_13',
    categoryId: 'cat_5',
    name: 'Benefits',
    description: 'Questions about employee benefits and policies',
  },
  {
    id: 'subcat_14',
    categoryId: 'cat_5',
    name: 'Time Off',
    description: 'Vacation, sick leave, and time-off requests',
  },

  // Finance & Billing subcategories
  {
    id: 'subcat_15',
    categoryId: 'cat_6',
    name: 'Payment Issues',
    description: 'Problems with payments and transactions',
  },
  {
    id: 'subcat_16',
    categoryId: 'cat_6',
    name: 'Invoicing',
    description: 'Invoice generation and billing inquiries',
  },
];