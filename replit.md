# Flow Editor Application

## Overview

This is a React-based flow editor application for creating and managing workflow sequences. It allows users to visually design flows using drag-and-drop nodes, configure actions and conditions, and manage flow persistence. The application uses a modern tech stack with React Flow for the visual editor, shadcn/ui for components, and a PostgreSQL database for storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Components**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS styling
- **Flow Editor**: React Flow library for creating interactive node-based flow diagrams
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming

### Backend Architecture
- **Server**: Express.js with TypeScript for RESTful API endpoints
- **Development Mode**: Vite middleware integration for hot module replacement
- **Storage Layer**: Pluggable storage interface with in-memory implementation and PostgreSQL support
- **Validation**: Zod schemas for request/response validation and type safety
- **Error Handling**: Centralized error middleware with structured error responses

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless integration
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema**: Shared TypeScript schemas between client and server using Drizzle Zod
- **Migrations**: Drizzle Kit for database schema migrations and version control
- **Fallback**: In-memory storage implementation for development and testing

### Flow Editor Components
- **Node Types**: Three specialized node types (Action, Condition, Condition Check) with custom React components
- **Node Data Validation**: Strongly typed node data structures with Zod validation
- **Connection Rules**: Business logic for valid node connections and flow validation
- **Properties Panel**: Dynamic form controls for editing node configurations
- **Export Functionality**: JSON export with both legacy and modern edge connection formats

### Authentication and Authorization
- **Current State**: No authentication system implemented
- **Session Handling**: Express session middleware configured but not actively used
- **Future Considerations**: Architecture supports adding authentication middleware

## External Dependencies

### Core Libraries
- **React Flow**: Interactive node-based editor for flow diagrams
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL support
- **Zod**: Schema validation and type inference

### UI and Styling
- **Radix UI**: Headless UI components for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for creating component variants

### Development Tools
- **Vite**: Build tool and development server with HMR
- **TypeScript**: Static typing for both client and server code
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Connect PG Simple**: PostgreSQL session store for Express
- **Drizzle Kit**: Database migration and introspection tools

### Validation and Forms
- **React Hook Form**: Form state management and validation
- **Hookform Resolvers**: Integration between React Hook Form and Zod schemas

### Development Environment
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Runtime Error Overlay**: Development error handling and display
- **Cartographer**: Development tooling for Replit environment