import type { Document, SuggestedResponse } from '../../app/shared/types';

export const mockDocuments: Document[] = [
  {
    id: 'doc_1',
    tags: [
      { key: 'type', value: 'manual' },
      { key: 'platform', value: 'web' },
    ],
    categories: ['cat_1', 'cat_2'],
    subcategories: ['subcat_1', 'subcat_2', 'subcat_5'],
  },
  {
    id: 'doc_2',
    tags: [
      { key: 'type', value: 'guide' },
      { key: 'department', value: 'IT' },
    ],
    categories: ['cat_1'],
    subcategories: ['subcat_3', 'subcat_4'],
  },
  {
    id: 'doc_3',
    tags: [
      { key: 'type', value: 'faq' },
      { key: 'department', value: 'HR' },
    ],
    categories: ['cat_5'],
    subcategories: ['subcat_13', 'subcat_14'],
  },
  {
    id: 'doc_4',
    tags: [
      { key: 'type', value: 'troubleshooting' },
      { key: 'platform', value: 'desktop' },
    ],
    categories: ['cat_3'],
    subcategories: ['subcat_8', 'subcat_9'],
  },
  {
    id: 'doc_5',
    tags: [
      { key: 'type', value: 'policy' },
      { key: 'department', value: 'Finance' },
    ],
    categories: ['cat_6'],
    subcategories: ['subcat_15', 'subcat_16'],
  },
];

export const mockSuggestedResponses: SuggestedResponse[] = [
  {
    id: 'response_1',
    response: 'Have you tried turning it off and on again? This resolves many common technical issues.',
    documents: ['doc_1', 'doc_2'],
  },
  {
    id: 'response_2',
    response: 'Please check your spam/junk folder for the email. If it\'s not there, I can resend it manually.',
    documents: ['doc_1'],
  },
  {
    id: 'response_3',
    response: 'This appears to be a browser-related issue. Please try clearing your cache and cookies, or use a different browser.',
    documents: ['doc_4'],
  },
  {
    id: 'response_4',
    response: 'Thank you for the feature request! I\'ve forwarded this to our development team for consideration in future updates.',
    documents: ['doc_2'],
  },
  {
    id: 'response_5',
    response: 'For network connectivity issues, please check if other devices on your network are experiencing similar problems.',
    documents: ['doc_2'],
  },
  {
    id: 'response_6',
    response: 'I can help you with that! Please refer to our benefits documentation for detailed information about coverage options.',
    documents: ['doc_3'],
  },
  {
    id: 'response_7',
    response: 'Payment issues can often be resolved by checking with your bank or trying a different payment method. Let me look into this for you.',
    documents: ['doc_5'],
  },
  {
    id: 'response_8',
    response: 'Performance issues are often caused by high server load. Our team is investigating and will provide updates soon.',
    documents: ['doc_4'],
  },
];