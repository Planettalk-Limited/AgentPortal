# Environment Setup for Agent Portal

## Environment Variables

The Agent Portal uses environment variables to configure URLs and API endpoints. Here's how to set them up:

### 1. Create Environment Files

Create the following files in your project root:

#### `.env.local` (for local development)
```env
# Base URL for the application
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Environment
NODE_ENV=development
```

#### `.env.production` (for production deployment)
```env
# Base URL for the application
NEXT_PUBLIC_BASE_URL=https://agent-portal.planettalk.com

# API Configuration
NEXT_PUBLIC_API_URL=https://api.planettalk.com/api
NEXT_PUBLIC_API_TIMEOUT=30000

# Environment
NODE_ENV=production
```

### 2. URL Configuration Logic

The application automatically handles URL configuration based on environment:

- **Development (`NODE_ENV=development`)**: Uses `http://localhost:3001`
- **Production**: Uses `NEXT_PUBLIC_BASE_URL` environment variable

### 3. Referral Link Generation

Referral links are automatically generated using the configured base URL:

```typescript
// Development
http://localhost:3001/en/referral/DIASPORA2024

// Production
https://agent-portal.planettalk.com/en/referral/DIASPORA2024
```

### 4. Share Functionality

The share functionality supports:

- **Web Share API**: For mobile devices with native sharing
- **Clipboard API**: Fallback for desktop browsers
- **Language-aware URLs**: Automatically includes user's language preference

### 5. Usage Examples

#### In Components
```typescript
import { generateReferralUrl, shareReferralLink } from '@/lib/utils/config'

// Generate a referral URL
const url = generateReferralUrl('DIASPORA2024', 'en')

// Share a referral link
const result = await shareReferralLink('DIASPORA2024', 'John Doe', 'en')
```

#### With ShareButton Component
```tsx
<ShareButton 
  code="DIASPORA2024"
  agentName="John Doe"
  variant="primary"
  size="md"
  showUrl={true}
/>
```

### 6. Security Notes

- Only environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Sensitive API keys should not use the `NEXT_PUBLIC_` prefix
- The `.env.local` file should be added to `.gitignore`

### 7. Deployment

For deployment platforms:

#### Vercel
1. Go to Project Settings > Environment Variables
2. Add `NEXT_PUBLIC_BASE_URL` with your production domain
3. Add other required variables

#### Other Platforms
Set the environment variables in your deployment configuration:
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `NODE_ENV=production`
