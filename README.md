# Why Should I Care (WSIC)

**Discover and understand topics you might not initially find interesting.**

WSIC is a modern web application that helps users explore new topics and expand their knowledge through engaging, accessible content. The platform presents information in a visually appealing format designed to spark curiosity and encourage learning.

## ✨ Features

- **Topic Discovery** - Search and explore a wide range of subjects
- **Engaging Content Blocks** - Beautifully designed content with glassmorphism effects
- **Google Authentication** - Secure sign-in with Google OAuth
- **Personalized Dashboard** - Customized experience for authenticated users
- **Social Engagement** - Like, save, and share interesting content
- **Responsive Design** - Optimized for desktop and mobile devices

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd wsic

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Configure your .env file with database and OAuth credentials

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application in action.

## 🛠 Technology Stack

- **Framework**: Next.js 15.4.6 with App Router
- **Frontend**: React 19.1.0, TypeScript 5
- **Styling**: Tailwind CSS 4, Radix UI, Class Variance Authority
- **Authentication**: Better Auth 1.3.6 with Google OAuth
- **Database**: PostgreSQL (auth sessions), Convex (main data)
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Getting Started](./docs/getting-started.md)** - Complete setup and installation guide
- **[Project Structure](./docs/project-structure.md)** - Codebase organization and file structure
- **[API Reference](./docs/api-reference.md)** - Authentication system and API endpoints
- **[Components](./docs/components.md)** - UI component library and usage examples
- **[Configuration](./docs/configuration.md)** - Environment variables and build configuration
- **[Styling Guide](./docs/styling-guide.md)** - Design system and styling patterns
- **[Changelog](./docs/CHANGELOG.md)** - Project updates and version history

## 🏗 Architecture

WSIC uses a modern, scalable architecture:

- **Dual Database System**: PostgreSQL for authentication data, Convex for real-time application data
- **Server Components**: Leverages Next.js 15 App Router for optimal performance
- **Route Protection**: Middleware-based authentication for secure user areas
- **Glassmorphism Design**: Modern UI with backdrop blur effects and smooth animations

## 🔧 Development

```bash
# Development commands
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

## 🌟 Key Components

- **Block Component** - Content display with glassmorphism design and hover effects
- **GoogleSignInButton** - OAuth authentication with loading states and error handling
- **SuggestedTopics** - Interactive topic suggestions with customizable lists
- **TopBar** - Navigation header with user authentication state
- **Footer** - Site footer with branding and social links

## 📱 User Experience

1. **Anonymous Browsing** - Explore trending content without signing in
2. **Search & Discovery** - Find topics of interest (requires authentication)
3. **Personalized Dashboard** - Access saved content and personalized recommendations
4. **Social Features** - Engage with content through likes, shares, and saves

## 🔒 Security

- Google OAuth integration for secure authentication
- Session management with Better Auth
- Protected routes with Next.js middleware
- Environment-based configuration for sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions:

- Check the [documentation](./docs/README.md) for detailed guides
- Review [troubleshooting](./docs/getting-started.md#troubleshooting) for common issues
- Open an issue for bug reports or feature requests

---

**Built for Code with Kiro hackathon**
**Built with ❤️ using Next.js, React, and modern web technologies.**
