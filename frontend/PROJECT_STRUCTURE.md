# Next.js Ticketing System - Project Structure

This project follows industry-standard Next.js 13+ App Router conventions with feature-based architecture and clean separation of concerns.

## Directory Structure

```
frontend/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   ├── globals.css                # Global styles
│   └── favicon.ico                # Favicon
│
├── src/
│   ├── app/                       # Application layer
│   │   ├── features/              # Feature-based modules
│   │   │   ├── auth/              # Authentication feature
│   │   │   ├── tickets/           # Ticket management
│   │   │   ├── categories/        # Category management
│   │   │   ├── knowledge-base/    # Knowledge base
│   │   │   ├── dashboard/         # Dashboard components
│   │   │   │   ├── index.ts       # Feature exports
│   │   │   │   └── StatsCard.tsx  # Dashboard components
│   │   │   ├── users/             # User management
│   │   │   ├── analytics/         # Analytics and reports
│   │   │   └── settings/          # Application settings
│   │   │
│   │   └── shared/                # Shared application code
│   │       ├── components/        # Reusable UI components
│   │       │   ├── ui/            # Basic UI components
│   │       │   │   ├── Badge.tsx  # Custom badge component
│   │       │   │   └── index.ts   # UI exports
│   │       │   ├── Header.tsx     # App header
│   │       │   ├── Sidebar.tsx    # App sidebar
│   │       │   ├── MainLayout.tsx # Main layout wrapper
│   │       │   ├── StatusBadge.tsx# Status badge components
│   │       │   ├── LoadingSpinner.tsx # Loading component
│   │       │   └── index.ts       # Component exports
│   │       │
│   │       ├── hooks/             # Custom React hooks
│   │       │   └── useLocalStorage.ts # localStorage hook
│   │       │
│   │       ├── types/             # TypeScript type definitions
│   │       │   └── index.ts       # All shared types
│   │       │
│   │       └── utils/             # Shared utilities
│   │           └── index.ts       # Utility exports
│   │
│   ├── constants/                 # Application constants
│   │   ├── api.ts                 # API endpoints
│   │   ├── routes.ts              # Route definitions
│   │   ├── tickets.ts             # Ticket-related constants
│   │   └── index.ts               # Constants exports
│   │
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.tsx        # Authentication context
│   │   ├── ThemeContext.tsx       # Theme management
│   │   └── index.ts               # Context exports
│   │
│   ├── lib/                       # Core library code
│   │   ├── api/                   # API client and services
│   │   │   ├── client.ts          # HTTP client setup
│   │   │   ├── tickets.ts         # Ticket API calls
│   │   │   ├── categories.ts      # Category API calls
│   │   │   ├── documents.ts       # Document API calls
│   │   │   └── index.ts           # API exports
│   │   │
│   │   ├── utils/                 # Core utilities
│   │   │   ├── date.ts            # Date formatting utilities
│   │   │   ├── formatting.ts      # Display formatting
│   │   │   ├── common.ts          # Common utilities
│   │   │   └── index.ts           # Utility exports
│   │   │
│   │   └── validations/           # Schema validations (future)
│   │
│   └── store/                     # State management (future)
│       └── index.ts               # Store configuration
│
├── public/                        # Static assets
│   └── favicon.ico                # App icon
│
├── .env.local                     # Environment variables (local)
├── .env.example                   # Environment template
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── next.config.ts                 # Next.js configuration
├── tailwind.config.js             # Tailwind CSS config
├── postcss.config.mjs             # PostCSS config
├── prettier.config.mjs            # Prettier config
├── eslint.config.mjs              # ESLint config
└── PROJECT_STRUCTURE.md           # This file
```

## Architecture Principles

### 1. Feature-Based Organization
- Each major feature has its own directory under `src/app/features/`
- Features are self-contained with their own components, hooks, and utilities
- Shared code lives in `src/app/shared/`

### 2. Layer Separation
- **App Layer** (`src/app/`): React components and UI logic
- **Lib Layer** (`src/lib/`): Core business logic and utilities
- **Constants** (`src/constants/`): Application-wide constants
- **Contexts** (`src/contexts/`): Global state management

### 3. Import Conventions
```typescript
// ✅ Correct imports
import { ticketsApi } from '@/lib/api';
import { ROUTES } from '@/constants';
import { Badge } from '@/app/shared/components/ui';
import type { Ticket } from '@/app/shared/types';

// ❌ Avoid relative imports beyond one level
import { ticketsApi } from '../../../lib/api/tickets';
```

### 4. Component Organization
- **UI Components** (`ui/`): Reusable, generic components
- **Feature Components**: Specific to a feature domain
- **Layout Components**: App structure and navigation
- **Shared Components**: Used across multiple features

### 5. Type Safety
- All types defined in `src/app/shared/types/`
- API response types match backend contracts
- Strict TypeScript configuration

## File Naming Conventions
- **Components**: PascalCase (e.g., `StatusBadge.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useLocalStorage.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE for values, camelCase for files
- **Types**: PascalCase for interfaces, camelCase for files

## Import/Export Patterns
- Use index.ts files for clean exports
- Re-export from feature directories
- Barrel exports for better developer experience

## Best Practices
1. **Colocation**: Keep related files close together
2. **Single Responsibility**: Each file has one clear purpose
3. **Type Safety**: Use TypeScript throughout
4. **Consistent Naming**: Follow established conventions
5. **Clean Imports**: Use absolute imports with path mapping
6. **Documentation**: Document complex logic and APIs

## Future Considerations
- State management with Redux Toolkit or Zustand
- Form validation with React Hook Form + Zod
- Testing structure with Jest and React Testing Library
- Storybook for component documentation
- Bundle analysis and optimization