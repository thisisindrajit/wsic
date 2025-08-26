# Product Overview

**WSIC (Why Should I Care)** is a web application that helps users discover and understand topics they might not initially find interesting. The platform presents information in an engaging, accessible format to spark curiosity and learning.

## Core Features
- Topic exploration with search functionality
- User authentication via Google OAuth
- Content blocks with trending topics
- Personalized dashboard for authenticated users
- Social engagement features (likes, saves, shares)

## User Flow
- Anonymous users can browse trending content and search topics
- Topic search requires authentication - users redirected to login to generate blocks
- Authentication redirects users to a personalized dashboard
- Protected routes require login via middleware
- New users are guided through onboarding flow

## Target Audience
Users seeking to expand their knowledge and discover new interests in an engaging, social format.