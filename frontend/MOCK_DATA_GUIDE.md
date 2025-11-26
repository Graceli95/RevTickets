# Mock Data System Guide

## Overview
The mock data system provides a complete development environment that simulates real backend API responses. This allows frontend development to proceed independently while the backend is being developed.

## Quick Start

### 1. Environment Configuration
Set `NEXT_PUBLIC_USE_MOCK_API=true` in your `.env.local` file to enable mock mode:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK_API=true
```

### 2. Switching Between Mock and Real API
To switch to the real API when it's ready, simply change the environment variable:
```bash
NEXT_PUBLIC_USE_MOCK_API=false
```

The API switching happens automatically based on this environment variable. No code changes needed!

## Available Mock Data

### 📊 **Tickets** (8 realistic tickets)
- Various statuses: new, open, in_progress, waiting_for_agent, resolved, closed
- Different priorities: low, medium, high, critical
- Complete with descriptions, timestamps, and agent assignments
- Associated comments for realistic interactions

### 👥 **Users** (7 users total)
- 4 regular users (John Smith, Sarah Johnson, Mike Davis, + 1 more)
- 3 support agents (Alex Rodriguez, Emily Chen, David Wilson, Lisa Thompson)
- Realistic email addresses and timestamps

### 📂 **Categories & Subcategories**
- **6 main categories**: Technical Support, Account Management, Bug Reports, Feature Requests, HR Inquiries, Finance & Billing
- **16 subcategories**: Hardware Issues, Software Issues, Password Reset, UI/UX Bugs, etc.
- Proper hierarchical relationships

### 🏷️ **Tags**
- **17 different tags**: priority levels, departments, types, platforms
- Realistic key-value pairs for categorization

### 📋 **Comments**
- **8 realistic comment threads** on various tickets
- Conversations between users and agents
- Timestamps showing realistic interaction patterns

## API Features

### 🔄 **Full CRUD Operations**
All mock APIs support:
- **Create**: Add new tickets, comments, categories
- **Read**: Get individual items or filtered lists
- **Update**: Modify existing data
- **Delete**: Remove items (with cascade for related data)

### 🔍 **Advanced Filtering & Search**
- **Tickets**: Filter by status, priority, severity, category, user, agent
- **Search**: Full-text search in ticket titles, descriptions, and content
- **Categories**: Filter subcategories by category
- **Documents**: Filter by category and subcategory

### ⏱️ **Realistic Response Times**
- Simulated network delays (200-1000ms)
- Longer delays for write operations
- Configurable timing for testing different scenarios

### 📈 **Statistics Generation**
- Real-time stats calculated from mock data
- Ticket counts by status, priority, and severity
- Updates automatically as data changes

## Usage Examples

### Basic Data Fetching
```typescript
import { ticketsApi } from '@/lib/api';

// Get all tickets
const tickets = await ticketsApi.getAll();

// Get filtered tickets
const openTickets = await ticketsApi.getAll({ status: 'open' });

// Get ticket statistics
const stats = await ticketsApi.getStats();
```

### Creating New Data
```typescript
// Create a new ticket
const newTicket = await ticketsApi.create({
  categoryId: 'cat_1',
  subCategoryId: 'subcat_1',
  userId: 'user_1',
  title: 'New Issue',
  description: 'Description here',
  content: 'Detailed content',
  tagIds: ['tag_urgent'],
  priority: 'high',
  severity: 'medium',
});

// Add a comment
const comment = await ticketsApi.createComment(newTicket.id, {
  userId: 'agent_1',
  content: 'Thanks for reporting this issue!',
});
```

### Search Functionality
```typescript
// Search tickets
const searchResults = await ticketsApi.search({
  q: 'password reset',
  status: 'open',
  priority: 'high',
});
```

## Data Relationships

### Ticket → User Relationships
- `userId`: The user who created the ticket
- `agentId`: The agent assigned to the ticket (optional)

### Ticket → Category Relationships
- `categoryId`: Primary category (Technical Support, Account Management, etc.)
- `subCategoryId`: Specific subcategory (Hardware Issues, Password Reset, etc.)

### Comment → Ticket Relationships
- `ticketId`: Links comments to their parent ticket
- Automatic ticket `updatedAt` timestamp updates when comments are added

## Testing Scenarios

### 1. Empty States
```typescript
// Test with no results
const emptyResults = await ticketsApi.getAll({ status: 'nonexistent' });
```

### 2. Error Handling
```typescript
try {
  const ticket = await ticketsApi.getById('invalid_id');
} catch (error) {
  // Mock APIs throw realistic errors
  console.error('Ticket not found:', error.message);
}
```

### 3. Performance Testing
```typescript
// Test with delays
import { withRandomDelay } from '@/lib/mock-data';

const slowData = await withRandomDelay(
  await ticketsApi.getAll(),
  1000, // min delay
  3000  // max delay
);
```

## Data Persistence

### Session-Based Persistence
- Data changes persist during the browser session
- Refreshing the page resets to original mock data
- Perfect for development and demo purposes

### Resetting Data
To reset to original mock data:
1. Refresh the browser page, or
2. Restart the development server

## Development Workflow

### 1. Build Components with Mock Data
```typescript
// Component automatically uses mock or real API
import { ticketsApi } from '@/lib/api';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  
  useEffect(() => {
    ticketsApi.getAll().then(setTickets);
  }, []);
  
  // Component works with both mock and real data
}
```

### 2. Test Different Scenarios
- Create tickets with various statuses and priorities
- Test edge cases (empty results, errors)
- Verify UI with different data volumes

### 3. Seamlessly Switch to Real API
When backend is ready:
1. Set `NEXT_PUBLIC_USE_MOCK_API=false`
2. Update `NEXT_PUBLIC_API_BASE_URL` to real backend
3. No code changes needed!

## Best Practices

### 1. Use Realistic Data
The mock data is designed to be realistic. Use it to:
- Test UI with real-world scenarios
- Validate business logic
- Demo to stakeholders

### 2. Test Error States
```typescript
// Mock APIs include error scenarios
try {
  await ticketsApi.getById('invalid_id');
} catch (error) {
  // Handle errors the same way as real API
}
```

### 3. Performance Considerations
```typescript
// Mock APIs include realistic delays
// Use loading states in your components
const [loading, setLoading] = useState(true);

useEffect(() => {
  ticketsApi.getAll()
    .then(setTickets)
    .finally(() => setLoading(false));
}, []);
```

## Extending Mock Data

### Adding New Mock Data
```typescript
// In src/lib/mock-data/tickets.ts
export const mockTickets = [
  // Add new ticket objects here
  {
    id: 'ticket_new',
    categoryId: 'cat_1',
    // ... other properties
  }
];
```

### Adding New API Endpoints
```typescript
// In src/lib/api/mock/tickets.ts
export const mockTicketsApi = {
  // Add new methods here
  async getMyCustomEndpoint(): Promise<CustomData[]> {
    await simulateDelay();
    return customMockData;
  }
};
```

## Console Logging
The system logs which API mode is active:
- **Mock Mode**: `🔧 Using Mock API for development`
- **Real Mode**: `🚀 Using Real API`

Check your browser console to confirm the current mode.

## Next Steps
1. **Build Components**: Use the mock APIs to build your components
2. **Test Thoroughly**: Verify all functionality with mock data
3. **Switch to Real API**: When backend is ready, just change the environment variable
4. **Deploy**: The same code works in both modes

The mock data system provides everything needed for complete frontend development while maintaining compatibility with the real backend API.