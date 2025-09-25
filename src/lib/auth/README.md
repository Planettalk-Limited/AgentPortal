# Enhanced Authentication System

This document describes the upgraded authentication system implemented after the backend service refactor.

## Overview

The authentication system has been enhanced with:
- ✅ Centralized auth state management via React Context
- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ Automatic route protection
- ✅ Token validation and refresh
- ✅ Enhanced security patterns

## Architecture

### Core Components

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Centralized authentication state
   - User management and permissions
   - Route protection logic
   - Token validation

2. **AuthService** (`src/lib/api/services/auth.service.ts`)
   - Updated API endpoints
   - Token management
   - User preferences support

3. **AuthGuard** (`src/components/AuthGuard.tsx`)
   - Component-level permission control
   - Role-based UI rendering
   - Fallback content support

4. **useAuth Hook** (`src/hooks/useAuth.ts`)
   - Convenient auth utilities
   - Permission checking helpers
   - User info helpers

## Usage Examples

### Basic Authentication

```tsx
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, login, logout, loading, error } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Role-Based Access Control

```tsx
import { useAuth } from '@/hooks/useAuth'
import { AdminOnly, AgentOnly, AuthGuard } from '@/components/AuthGuard'

function Dashboard() {
  const { hasRole, hasPermission } = useAuth()

  return (
    <div>
      {/* Simple role check */}
      <AdminOnly>
        <AdminPanel />
      </AdminOnly>

      <AgentOnly>
        <AgentPanel />
      </AgentOnly>

      {/* Permission-based check */}
      <AuthGuard permissions="users.manage">
        <UserManagementButton />
      </AuthGuard>

      {/* Multiple requirements */}
      <AuthGuard 
        roles={['admin', 'pt_admin']} 
        permissions="system.admin"
        requireAll={true}
      >
        <SystemAdminPanel />
      </AuthGuard>

      {/* Custom logic */}
      {hasRole('admin') && hasPermission('reports.view') && (
        <ReportsSection />
      )}
    </div>
  )
}
```

### Page Protection

```tsx
import { withAuth } from '@/contexts/AuthContext'

// Protect entire page
function AdminPage() {
  return <div>Admin Content</div>
}

export default withAuth(AdminPage, ['admin', 'pt_admin'])
```

### Login Form

```tsx
import { useAuth } from '@/hooks/useAuth'

function LoginForm() {
  const { login, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      // Redirect handled automatically
    } catch (err) {
      // Error displayed automatically
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={clearError}
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onFocus={clearError}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

## Roles and Permissions

### User Roles

1. **admin** - Full system access
2. **pt_admin** - PlanetTalk admin with most permissions
3. **agent** - Agent-specific functionality

### Permission System

#### Admin Permissions
- `users.manage` - Create, update, delete users
- `agents.manage` - Manage agent accounts
- `applications.review` - Review agent applications
- `payouts.manage` - Approve/reject payouts
- `system.admin` - System administration
- `reports.view` - Access reports
- `notifications.manage` - Send notifications
- `training.manage` - Manage training materials

#### Agent Permissions
- `profile.update` - Update own profile
- `payouts.request` - Request payouts
- `earnings.view` - View earnings
- `referrals.manage` - Manage referral codes
- `training.access` - Access training materials

## Route Protection

### Automatic Protection

The `AuthProvider` automatically protects routes based on:

1. **Public Routes** (no auth required):
   - `/`
   - `/auth/*`
   - `/public/*`
   - `/about`, `/contact`, etc.

2. **Role-Protected Routes**:
   - `/admin/*` - Requires admin/pt_admin
   - `/agent/*` - Requires agent role
   - `/dashboard/*` - Any authenticated user

### Manual Protection

Use the `withAuth` HOC for component-level protection:

```tsx
export default withAuth(MyComponent, ['admin', 'pt_admin'])
```

## Authentication Flow

### Login Process

1. User submits credentials
2. `AuthContext.login()` calls API
3. Token stored in localStorage
4. User data stored in context
5. Automatic redirect based on role:
   - Admin → `/admin/dashboard`
   - Agent → `/agent`
   - Default → `/dashboard`

### Token Validation

1. On app initialization, stored token is validated
2. Fresh user data fetched to ensure accuracy
3. Invalid tokens automatically clear auth state
4. Users redirected to login if needed

### Logout Process

1. API logout call (optional)
2. Local storage cleared
3. Auth state cleared
4. Redirect to home page

## Security Features

### Token Management
- Secure storage in localStorage
- Automatic token validation
- Graceful handling of expired tokens

### Route Protection
- Automatic redirects for unauthorized access
- Role-based route filtering
- Protection against direct URL access

### Permission Checking
- Component-level permission gates
- Function-level permission helpers
- Fallback content for unauthorized users

### Error Handling
- Comprehensive error states
- User-friendly error messages
- Automatic error clearing

## Migration Guide

### From Old Auth System

1. **Replace direct API calls**:
   ```tsx
   // Old
   const user = api.auth.initializeAuth()
   
   // New
   const { user } = useAuth()
   ```

2. **Replace manual auth checks**:
   ```tsx
   // Old
   if (user?.role === 'admin') { ... }
   
   // New
   const { hasRole } = useAuth()
   if (hasRole('admin')) { ... }
   ```

3. **Replace layout auth logic**:
   ```tsx
   // Old - Manual auth in every layout
   useEffect(() => {
     const storedUser = api.auth.initializeAuth()
     if (!storedUser) router.push('/login')
   }, [])
   
   // New - Automatic via AuthProvider
   // No manual checks needed
   ```

4. **Use AuthGuard components**:
   ```tsx
   // Old
   {user?.role === 'admin' && <AdminButton />}
   
   // New
   <AdminOnly><AdminButton /></AdminOnly>
   ```

## Best Practices

### 1. Use Appropriate Granularity
- Page-level: `withAuth` HOC
- Component-level: `AuthGuard`
- Logic-level: `hasRole`/`hasPermission`

### 2. Provide Fallbacks
```tsx
<AuthGuard 
  permissions="users.manage"
  fallback={<p>Access denied</p>}
>
  <UserManagement />
</AuthGuard>
```

### 3. Clear Error States
```tsx
<input 
  onFocus={clearError}  // Clear errors when user interacts
  onChange={handleChange}
/>
```

### 4. Handle Loading States
```tsx
if (loading) return <LoadingSpinner />
if (!user) return <LoginPrompt />
```

### 5. Use Permission Helpers
```tsx
const canManage = useCanManageUsers()
const isAdmin = useIsAdmin()
```

## Debugging

### Auth Context
Use React DevTools to inspect auth context state:
- User data
- Loading states
- Error messages

### Console Logging
Auth operations are logged for debugging:
- Login attempts
- Token validation
- Route protection

### Network Tab
Monitor API calls:
- Login requests
- Token validation
- Profile updates

## Testing

### Unit Tests
Test auth functions with mocked context:

```tsx
import { renderWithAuth } from '@/test-utils'

test('shows admin content for admin users', () => {
  const { getByText } = renderWithAuth(
    <AdminOnly>Admin Content</AdminOnly>,
    { user: { role: 'admin' } }
  )
  expect(getByText('Admin Content')).toBeInTheDocument()
})
```

### Integration Tests
Test complete auth flows:
- Login/logout
- Route protection
- Permission checking

### E2E Tests
Test user journeys:
- Complete login flow
- Role-based navigation
- Permission-based UI changes

## Performance

### Optimizations
- Minimal re-renders via optimized context
- Efficient permission checking
- Lazy route protection

### Monitoring
- Track auth state changes
- Monitor route protection performance
- Measure login/logout times

## Troubleshooting

### Common Issues

1. **Infinite redirects**
   - Check public route configuration
   - Verify role requirements

2. **Components not updating**
   - Ensure proper context wrapping
   - Check hook dependencies

3. **Permission not working**
   - Verify permission strings
   - Check role assignments

4. **Token issues**
   - Clear localStorage
   - Check token expiration
   - Verify API endpoints

### Support

For additional support:
1. Check console errors
2. Verify network requests
3. Review auth context state
4. Test with different user roles
