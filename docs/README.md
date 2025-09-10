# WSIC (Why Should I Care) - Documentation

**WSIC** is a web application that helps users discover and understand topics they might not initially find interesting. The platform presents information in an engaging, accessible format to spark curiosity and learning through AI-generated educational content.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [AI Content Generation](#ai-content-generation)
- [API Reference](#api-reference)
- [Development Setup](#development-setup)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

### Core Features

- **Topic Exploration**: Search and discover educational content on any subject
- **AI-Generated Content**: Comprehensive educational modules created by multi-agent AI system
- **Interactive Learning**: Quizzes, exercises, and real-world applications
- **User Authentication**: Google OAuth integration with Better Auth
- **Personalized Dashboard**: Track progress and save favorite topics
- **Social Features**: Like, share, and save educational content

### User Flow

1. **Anonymous Browsing**: Users can explore trending content and search topics
2. **Authentication Required**: Topic generation requires login (redirects to Google OAuth)
3. **Content Generation**: AI creates comprehensive educational modules
4. **Interactive Learning**: Users engage with quizzes, exercises, and real-world examples
5. **Progress Tracking**: Authenticated users can track learning progress

## 🏗️ Architecture

### Frontend (Next.js 15.4.6)

- **App Router**: Modern Next.js routing with server components
- **React 19.1.0**: Latest React features and concurrent rendering
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS 4**: Utility-first styling with custom design system
- **Radix UI**: Accessible component primitives

### Backend Services

- **Convex**: Real-time database for main application data
- **PostgreSQL**: User sessions and analytics (Better Auth)
- **AI Agents**: Multi-agent content generation system

### Authentication

- **Better Auth**: Modern authentication library
- **Google OAuth**: Social login provider
- **Route Protection**: Middleware-based protection for `/user/*` paths

## 💾 Database Schema

### Dual Database Architecture

#### Convex Database (Main Application Data)

- **Topics**: Educational content with metadata
- **Blocks**: Individual content pieces (text, exercises, media)
- **Categories**: 26 comprehensive topic categories
- **User Interactions**: Views, likes, saves, completions
- **Generation Requests**: AI content generation tracking

#### PostgreSQL (Authentication & Analytics)

- **User Sessions**: Better Auth session management
- **Analytics Data**: User behavior and engagement metrics

### Categories (26 Total)

The system includes 26 comprehensive categories covering any topic:

1. **Technology** 💻 - Computing, AI, programming
2. **Science** 🔬 - Physics, chemistry, biology
3. **Health & Medicine** 🏥 - Healthcare, medical research
4. **Business & Finance** 💼 - Economics, entrepreneurship
5. **Education & Learning** 📚 - Teaching, academic subjects
6. **Arts & Culture** 🎨 - Visual arts, music, literature
7. **History** 🏛️ - Historical events, civilizations
8. **Environment & Nature** 🌱 - Ecology, climate change
9. **Psychology & Mental Health** 🧠 - Human behavior
10. **Sports & Fitness** ⚽ - Athletics, exercise science
11. **Food & Nutrition** 🍎 - Culinary arts, dietary science
12. **Travel & Geography** 🌍 - World cultures, destinations
13. **Language & Communication** 💬 - Linguistics, languages
14. **Philosophy & Ethics** 🤔 - Philosophical thought
15. **Mathematics** 📐 - Pure and applied mathematics
16. **Engineering** ⚙️ - All engineering disciplines
17. **Social Sciences** 👥 - Sociology, anthropology
18. **Law & Government** ⚖️ - Legal systems, governance
19. **Religion & Spirituality** 🕊️ - World religions
20. **Media & Entertainment** 🎬 - Film, TV, gaming
21. **Architecture & Design** 🏗️ - Building design
22. **Agriculture & Farming** 🚜 - Crop science, farming
23. **Transportation** 🚗 - Vehicles, logistics
24. **Energy & Resources** ⚡ - Renewable energy
25. **Personal Development** 🌟 - Self-improvement
26. **Other** 📂 - Miscellaneous topics

## 🤖 AI Content Generation

### Multi-Agent System

The AI content generation uses a sophisticated multi-agent architecture:

#### 1. Research Agent (Brief)

- **Purpose**: Gather foundational information
- **Model**: Gemini 2.5 Flash
- **Tools**: Exa AI Search
- **Output**: Overview and key concepts

#### 2. Quiz Agent

- **Purpose**: Create 3 foundational quiz questions
- **Model**: Gemini 2.0 Flash Lite
- **Difficulty**: Adaptive based on user input
- **Output**: Multiple choice questions with explanations

#### 3. Research Agent (Deep)

- **Purpose**: Comprehensive detailed research
- **Model**: Gemini 2.5 Flash
- **Tools**: Exa AI Search
- **Output**: Historical context, technical details, innovations

#### 4. Reorder Agent

- **Purpose**: Create sequencing/prioritization exercises
- **Model**: Gemini 2.0 Flash Lite
- **Output**: Drag-and-drop ordering activities

#### 5. Real-World Impact Agent

- **Purpose**: Connect topics to current applications
- **Model**: Gemini 2.5 Flash
- **Tools**: Exa AI Search (news category)
- **Output**: Current relevance and use cases

#### 6. Final Quiz Agent

- **Purpose**: Comprehensive assessment
- **Model**: Gemini 2.0 Flash Lite
- **Output**: 5 questions covering all learned concepts

#### 7. Summary Agent

- **Purpose**: Create review materials
- **Model**: Gemini 2.0 Flash Lite
- **Output**: 3-4 flash cards for key concepts

#### 8. Thumbnail Generator Agent

- **Purpose**: Find relevant imagery
- **Model**: Gemini 2.5 Flash
- **Tools**: Serper Image Search
- **Output**: High-quality thumbnail with alt text

#### 9. Assembler Agent

- **Purpose**: Combine all components
- **Model**: Gemini 2.0 Flash Lite
- **Output**: Complete educational module JSON

#### 10. Convex Inserter Agent

- **Purpose**: Insert content into database
- **Model**: Gemini 2.0 Flash Lite
- **Tools**: Convex Python Client
- **Output**: Database insertion with topic ID

### Content Structure

Each generated educational module includes:

```json
{
  "topic": "Topic Title",
  "research_brief": {
    "title": "Brief Overview Title",
    "text": "Foundational content in markdown",
    "depth": "brief"
  },
  "research_deep": {
    "title": "Deep Dive Title",
    "text": "Detailed content in markdown",
    "depth": "deep"
  },
  "quiz": {
    "type": "quiz",
    "questions": [
      /* 3 questions */
    ]
  },
  "reorder": {
    "type": "reorder",
    "question": "Sequencing question",
    "options": ["Item 1", "Item 2", "Item 3", "Item 4"],
    "correct_answer": "Correct sequence",
    "explanation": "Why this order is correct"
  },
  "final_quiz": {
    "type": "final_quiz",
    "questions": [
      /* 5 comprehensive questions */
    ]
  },
  "real_world_impact": {
    "title": "Real-World Applications",
    "content": "Current relevance in markdown",
    "source_urls": ["url1", "url2"]
  },
  "flash_cards": [
    {
      "front": "Key term or question",
      "back": "Definition or answer"
    }
  ],
  "thumbnail": {
    "thumbnail_url": "https://image-url.com/image.jpg",
    "alt_text": "Accessibility description"
  }
}
```

## 🔌 API Reference

### Convex Functions

#### Topics

- `topics:getTrendingTopics` - Get trending topics for homepage
- `topics:searchTopics` - Search topics by title and content
- `topics:getTopicBySlug` - Get single topic with blocks
- `topics:getTopics` - Paginated topic browsing
- `topics:createTopic` - Create new topic (internal)
- `topics:publishTopic` - Publish topic (internal)

#### Categories

- `categories:getCategories` - Get all categories
- `categories:getCategoryBySlug` - Get category by slug
- `categories:createCategory` - Create new category (internal)

#### Blocks

- `blocks:getBlocksByTopic` - Get blocks for specific topic
- `blocks:createBlock` - Create new block (internal)

#### Database Management

- `seed:seedCategories` - Seed database with categories
- `seed:clearAllData` - Clear all data (use with caution)
- `seed:initializeDatabase` - Full database initialization

### Authentication API

- `/api/auth/[...all]` - Better Auth endpoints
- Google OAuth integration
- Session management

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Convex account
- Google OAuth credentials
- Exa AI API key
- Serper API key

### Environment Variables

Create `.env.local` for Next.js:

```env
# Database
CONVEX_URL=https://your-deployment.convex.cloud

# Authentication
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# PostgreSQL (for auth)
DATABASE_URL=postgresql://user:password@localhost:5432/wsic
```

Create `agents/topic_generator_agent/.env` for AI agents:

```env
# AI APIs
EXA_API_KEY=your-exa-api-key
SERPER_API_KEY=your-serper-api-key
EXA_NUM_RESULTS=5

# Convex
CONVEX_URL=https://your-deployment.convex.cloud
```

### Installation

1. **Clone and Install**

```bash
git clone <repository-url>
cd wsic
npm install
```

2. **Setup Convex**

```bash
npx convex dev
```

3. **Initialize Database**

```bash
npx convex run seed:initializeDatabase
```

4. **Install AI Agent Dependencies**

```bash
cd agents
pip install -r requirements.txt
```

5. **Start Development Server**

```bash
npm run dev
```

### Development Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx convex dev       # Start Convex development
npx convex deploy    # Deploy to production
npx convex run seed:initializeDatabase  # Reset database

# AI Agents
cd agents/topic_generator_agent
python example.py    # Test agent functionality
```

## 🚀 Deployment

### Convex Deployment

```bash
npx convex deploy --prod
```

### Vercel Deployment

```bash
vercel --prod
```

### Environment Setup

1. Set production environment variables
2. Update CONVEX_URL to production deployment
3. Configure Google OAuth for production domain
4. Set up PostgreSQL database for production

## 🤝 Contributing

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

### Development Workflow

1. Create feature branch
2. Implement changes with tests
3. Run linting and type checking
4. Submit pull request
5. Code review and merge

### Testing

- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical user flows

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Better Auth Documentation](https://better-auth.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://radix-ui.com)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review existing issues and discussions

---

**WSIC** - Making learning engaging, one topic at a time! 🎓✨
