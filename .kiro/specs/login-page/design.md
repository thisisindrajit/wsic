# Design Document

## Overview

The login page will be a clean, modern interface that serves as the entry point for users to authenticate with the "Why Should I Care" application. The design will maintain consistency with the existing application's visual identity while providing a focused authentication experience centered around Google OAuth integration.

## Architecture

### Page Structure
- **Route**: `/login` - A new Next.js page route
- **Layout**: Utilizes the existing root layout with minimal chrome
- **Authentication Flow**: Leverages the existing better-auth setup with Google provider
- **State Management**: Uses better-auth React hooks for session management
- **Responsive Design**: Mobile-first approach using Tailwind CSS

### Component Hierarchy
```
LoginPage
├── LoginContainer (main content wrapper)
│   ├── WelcomeSection (catchy phrase + branding)
│   ├── GoogleSignInButton (authentication CTA)
│   └── LoadingState (during auth process)
└── ErrorMessage (conditional error display)
```

## Components and Interfaces

### LoginPage Component
**Location**: `app/login/page.tsx`
**Purpose**: Main page component that orchestrates the login experience

**Key Features**:
- Responsive layout that works across all device sizes
- Integration with existing better-auth session management
- Automatic redirect for already authenticated users
- Error handling and user feedback

### GoogleSignInButton Component
**Location**: `components/GoogleSignInButton.tsx`
**Purpose**: Reusable button component for Google OAuth authentication

**Props Interface**:
```typescript
interface GoogleSignInButtonProps {
  isLoading?: boolean;
  onSignIn?: () => void;
  disabled?: boolean;
}
```

**Features**:
- Loading states with visual feedback
- Hover and focus states for accessibility
- Integration with better-auth signIn method
- Error handling for failed authentication attempts

### WelcomeSection Component
**Location**: `components/WelcomeSection.tsx`
**Purpose**: Display the catchy welcome phrase and app branding

**Features**:
- Gradient text styling consistent with homepage design
- Responsive typography scaling
- App logo/branding integration
- Engaging copy that reflects the app's purpose

## Data Models

### Authentication State
The login page will interact with the existing better-auth session state:

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  } | null;
  isLoading: boolean;
}
```

### Error State
```typescript
interface AuthError {
  message: string;
  type: 'oauth_error' | 'network_error' | 'unknown_error';
}
```

## Visual Design

### Layout Structure
- **Centered Design**: Main content centered both horizontally and vertically
- **Minimal Chrome**: Clean interface without navigation or footer distractions
- **Responsive Breakpoints**: 
  - Mobile: Single column, full-width button
  - Tablet: Centered with comfortable padding
  - Desktop: Centered with maximum width constraints

### Typography
- **Welcome Phrase**: Large, gradient text using the existing teal gradient (`from-teal-600 to-teal-400`)
- **Font**: Geist Sans (consistent with existing app)
- **Hierarchy**: 
  - Main headline: `text-4xl md:text-5xl xl:text-6xl font-light`
  - Subtext: `text-lg font-light`
  - Button text: `text-base font-medium`

### Color Scheme
- **Primary Colors**: Existing teal palette (`teal-500`, `teal-600`, `teal-400`)
- **Background**: Uses CSS custom properties for light/dark mode support
- **Text**: Follows existing foreground color variables
- **Button**: Teal background with white text, hover states

### Spacing and Layout
- **Container**: `max-w-md mx-auto` for optimal reading width
- **Vertical Spacing**: Consistent `gap-6` between major sections
- **Padding**: `p-4` on mobile, `p-8` on larger screens
- **Button**: Full width on mobile, fixed width on desktop

## Error Handling

### Error Types and Messages
1. **OAuth Errors**: "Unable to sign in with Google. Please try again."
2. **Network Errors**: "Connection issue. Please check your internet and try again."
3. **Unknown Errors**: "Something went wrong. Please try again later."

### Error Display
- **Position**: Below the sign-in button
- **Styling**: Red text with subtle background
- **Dismissal**: Auto-dismiss after 5 seconds or manual close
- **Accessibility**: Proper ARIA labels and focus management

## Testing Strategy

### Unit Tests
- **Component Rendering**: Verify all components render correctly
- **Authentication Flow**: Mock better-auth and test sign-in process
- **Error Handling**: Test various error scenarios
- **Responsive Design**: Test layout at different viewport sizes

### Integration Tests
- **OAuth Flow**: End-to-end Google authentication testing
- **Redirect Logic**: Verify proper redirects for authenticated users
- **Session Management**: Test session persistence and cleanup

### Accessibility Tests
- **Keyboard Navigation**: Ensure full keyboard accessibility
- **Screen Reader**: Test with screen reader compatibility
- **Color Contrast**: Verify WCAG compliance
- **Focus Management**: Proper focus states and order

## Implementation Notes

### Existing Integration Points
- **better-auth**: Utilizes existing `signIn` method from `lib/auth-client.ts`
- **Styling**: Leverages existing Tailwind configuration and CSS variables
- **Layout**: Uses existing root layout structure
- **Typography**: Consistent with homepage font and sizing patterns

### Security Considerations
- **CSRF Protection**: Handled by better-auth
- **Secure Cookies**: Configured in existing auth setup
- **OAuth State**: Managed by better-auth Google provider
- **Redirect Validation**: Ensure safe redirect URLs only

### Performance Optimizations
- **Code Splitting**: Login page as separate route bundle
- **Lazy Loading**: Components loaded only when needed
- **Image Optimization**: Any branding images optimized with Next.js Image
- **Minimal Dependencies**: Reuse existing UI components where possible