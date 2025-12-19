# AI Project - Frontend

A modern React + TypeScript frontend application with Clerk authentication and a clean API layer for Python backend services.

## 📁 Project Structure

```
aiproject/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx       # Navigation bar with auth buttons
│   │   ├── ProtectedRoute.tsx # Route protection wrapper
│   │   └── index.ts
│   ├── pages/               # Page components
│   │   ├── HomePage.tsx     # Public landing page
│   │   ├── DashboardPage.tsx # Protected dashboard
│   │   ├── ProfilePage.tsx  # User profile page
│   │   └── index.ts
│   ├── lib/
│   │   ├── api/             # API layer
│   │   │   ├── client.ts    # HTTP client with auth
│   │   │   ├── config.ts    # API endpoints & config
│   │   │   ├── services.ts  # API service methods
│   │   │   └── index.ts
│   │   └── queryClient.ts   # React Query configuration
│   ├── hooks/               # Custom React hooks
│   │   ├── useApi.ts        # API data fetching hooks
│   │   └── index.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── api.ts           # API request/response types
│   │   └── index.ts
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd aiproject
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and add your Clerk publishable key:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
VITE_API_BASE_URL=http://localhost:8000
```

Get your Clerk key from: https://dashboard.clerk.com

### 3. Start Development Server

```bash
npm run dev
```

The app will run on http://localhost:5173

### 4. Connect to Python Backend

Make sure your Python backend is running on http://localhost:8000. The Vite proxy will forward all `/api/*` requests to your backend.

## 🔐 Authentication Flow

### How Clerk Authentication Works

1. **User Signs In/Up** → Clerk handles the auth UI and session
2. **Clerk Provides Token** → Stored securely by Clerk SDK
3. **API Client Gets Token** → `apiClient.setTokenGetter(() => getToken())`
4. **Auto-Attach to Requests** → Every API call includes `Authorization: Bearer <token>`
5. **Backend Validates** → Your Python backend verifies the JWT token

### Using Authentication in Components

```typescript
import { useUser } from '@clerk/clerk-react';

function MyComponent() {
  const { user, isSignedIn } = useUser();
  
  if (!isSignedIn) return <div>Please sign in</div>;
  
  return <div>Hello {user.firstName}</div>;
}
```

## 📡 API Layer Architecture

### Making API Calls

The API layer is organized into services that correspond to backend endpoints:

```typescript
// Example: Fetch user profile
import { api } from '@/lib/api';

const response = await api.user.getMe();
console.log(response.data); // UserProfile object
```

### Using React Query Hooks

For better caching and state management, use the provided hooks:

```typescript
import { useProfile, useDataList } from '@/hooks';

function Dashboard() {
  // Automatically caches data and handles loading/error states
  const { data: profile, isLoading, error } = useProfile();
  const { data: dataList } = useDataList({ page: 1, pageSize: 10 });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{profile.email}</div>;
}
```

### API Client Flow

```
1. Component calls hook → useProfile()
2. Hook uses apiClient → api.user.getMe()
3. Client gets token → await getToken()
4. Client makes request → fetch('/api/users/me', { 
     headers: { Authorization: 'Bearer <token>' }
   })
5. Backend validates token
6. Backend returns data
7. React Query caches result
8. Component re-renders with data
```

## 🛠️ Key Features

### ✅ Automatic Token Management
- Clerk handles token storage and refresh
- API client automatically attaches tokens
- No manual token handling needed

### ✅ Type Safety
- Full TypeScript coverage
- Type-safe API calls
- Auto-completion for API methods

### ✅ Error Handling
- Centralized error handling in API client
- User-friendly error messages
- Network error recovery

### ✅ Caching & Performance
- React Query caches API responses
- Automatic background refetching
- Optimistic updates support

### ✅ Protected Routes
- Easy route protection with `<ProtectedRoute>`
- Automatic redirect to sign-in
- Preserves intended destination

## 📝 Adding New API Endpoints

### 1. Define TypeScript Types

```typescript
// src/types/api.ts
export interface MyData {
  id: string;
  name: string;
  value: number;
}
```

### 2. Add Endpoint Configuration

```typescript
// src/lib/api/config.ts
export const API_ENDPOINTS = {
  myData: {
    list: '/my-data',
    get: (id: string) => `/my-data/${id}`,
  },
};
```

### 3. Create Service Method

```typescript
// src/lib/api/services.ts
export const myDataService = {
  async list() {
    return apiClient.get<MyData[]>(API_ENDPOINTS.myData.list);
  },
  async get(id: string) {
    return apiClient.get<MyData>(API_ENDPOINTS.myData.get(id));
  },
};

// Add to api export
export const api = {
  // ... existing services
  myData: myDataService,
};
```

### 4. Create React Query Hook

```typescript
// src/hooks/useApi.ts
export function useMyDataList() {
  return useQuery({
    queryKey: ['myData', 'list'],
    queryFn: async () => {
      const response = await api.myData.list();
      return response.data;
    },
  });
}
```

### 5. Use in Component

```typescript
import { useMyDataList } from '@/hooks';

function MyComponent() {
  const { data, isLoading } = useMyDataList();
  // Component code
}
```

## 🔄 API Request/Response Flow

```
┌─────────────┐
│  Component  │
└──────┬──────┘
       │ useQuery/useMutation
       ▼
┌─────────────┐
│ React Hook  │ (useProfile, useDataList, etc.)
└──────┬──────┘
       │ calls service
       ▼
┌─────────────┐
│ API Service │ (api.user.getMe(), etc.)
└──────┬──────┘
       │ uses client
       ▼
┌─────────────┐
│ API Client  │ (apiClient.get(), .post(), etc.)
└──────┬──────┘
       │ 1. Get token from Clerk
       │ 2. Attach to headers
       │ 3. Make fetch request
       ▼
┌─────────────┐
│  Backend    │ Python FastAPI/Flask
│  (Port 8000)│
└──────┬──────┘
       │ 1. Validate JWT token
       │ 2. Process request
       │ 3. Return response
       ▼
┌─────────────┐
│  Response   │
└──────┬──────┘
       │ flows back up
       │ React Query caches
       ▼
┌─────────────┐
│  Component  │ Re-renders with data
└─────────────┘
```

## 🎨 Styling

The project uses Tailwind CSS utility classes inline. To add Tailwind CSS properly:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then configure `tailwind.config.js` and update `index.css`.

## 🐛 Debugging Tips

### API Not Connecting
- Check if Python backend is running on http://localhost:8000
- Verify proxy configuration in `vite.config.ts`
- Check browser console for CORS errors

### Token Not Attaching
- Ensure `useInitializeApiClient()` is called in `App.tsx`
- Verify Clerk is properly initialized
- Check if user is signed in with `useUser()` hook

### TypeScript Errors
- Run `npm run build` to see all errors
- Check that types are exported from `types/api.ts`
- Ensure API methods match service definitions

## 📚 Learn More

- [Clerk Documentation](https://clerk.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Wouter (Routing)](https://github.com/molefrog/wouter)
- [Vite Documentation](https://vitejs.dev)

## 🤝 Best Practices

1. **Always use the provided hooks** for API calls (better caching)
2. **Define types** for all API requests/responses
3. **Use protected routes** for authenticated pages
4. **Handle loading and error states** in components
5. **Keep components small** and focused
6. **Organize by feature** when the app grows

## �️ Database Setup (Neon + Drizzle)

This project uses **Neon** (serverless PostgreSQL) with **Drizzle ORM** for database operations. User data is automatically synced from Clerk authentication.

### 1. Set up Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string from your dashboard
4. Add it to your `.env` file:

```env
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

### 2. Run Database Migrations

```bash
npm run migrate
```

This creates the `users` table to store user data synced from Clerk.

### 3. Set up Clerk Webhooks (Optional - for Production)

**Note**: This project uses API-based user sync instead of webhooks for simplicity. Webhooks are optional and mainly useful for production environments where you want real-time sync.

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** in the sidebar
3. Click **Add Endpoint**
4. Set the URL to: `https://your-domain.com/api/webhooks/clerk`
   - For local development: `http://localhost:8000/api/webhooks/clerk`
5. Select these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. Copy the **Signing Secret** and add it to your `.env`:

```env
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 4. How User Sync Works (API-Based Approach)

- **User Signs In** → Frontend calls `/api/auth/sync-user`
- **Server Checks Database** → Looks for existing user by Clerk ID
- **Creates if New** → Adds user to Neon DB if they don't exist
- **Returns User Data** → Frontend gets synced user information

### 5. Testing the Webhook

#### Manual Test (Development)
```bash
npm run test:sync
```
This creates a test user in your database.

#### Real Webhook Test
1. **Start your server**: `npm run dev`
2. **Sign up a new user** in your app
3. **Check server logs** for webhook processing
4. **Verify database** has the new user

#### User Sync Logs
Your server will log sync events:
```
🔄 Auto-syncing user to database...
🎉 User user_123 synced to database: { ... }
```

### Database Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## �📦 Build for Production

```bash
npm run build
npm run preview
```

The production build will be in the `dist/` folder.
