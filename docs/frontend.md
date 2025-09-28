# Frontend Documentation

## Overview
This document outlines the frontend technologies and frameworks used in the Rovocs Web application.

## Core Technologies

### Next.js
- **Framework**: React-based full-stack framework
- **Features**: 
  - App Router (RSC - React Server Components)
  - Turbopack for fast builds and development
  - Built-in TypeScript support
  - API routes for backend functionality

### React 19.1.0
- **Library**: Latest React version with enhanced features
- **Features**:
  - Server Components support
  - Improved performance and concurrent features
  - Enhanced TypeScript integration

## UI Framework & Styling

### shadcn/ui
- **Purpose**: Modern, accessible component library
- **Configuration**:
  - Style: New York variant
  - Base color: Neutral
  - CSS variables enabled
  - TypeScript support (TSX)
  - React Server Components enabled

#### Installed Components
- Button (`@/components/ui/button.tsx`)
- Card (`@/components/ui/card.tsx`)
- Form (`@/components/ui/form.tsx`)
- Input (`@/components/ui/input.tsx`)
- Label (`@/components/ui/label.tsx`)

#### Component Structure
```
src/components/
├── ui/           # shadcn/ui components
├── auth-provider.tsx
├── dashboard-layout.tsx
├── sidebar.tsx
└── api-test.tsx
```

### Tailwind CSS 4
- **Purpose**: Utility-first CSS framework
- **Features**:
  - Custom CSS variables for theming
  - Responsive design utilities
  - Dark mode support
  - Custom animations with tw-animate-css

### Styling Utilities
- **clsx**: Conditional className utility
- **tailwind-merge**: Merge Tailwind classes intelligently
- **class-variance-authority**: Component variant management

## Animation & Motion

### Framer Motion (motion)
- **Version**: 12.23.16
- **Purpose**: Production-ready motion library for React
- **Features**:
  - Declarative animations
  - Gesture recognition
  - Layout animations
  - Scroll-triggered animations
  - Performance optimized

#### Common Animation Patterns
```tsx
import { motion } from 'motion'

// Basic fade in
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>

// Stagger animations
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
  Staggered content
</motion.div>
```

## Icons & Visual Elements

### Lucide React
- **Purpose**: Beautiful & consistent icon library
- **Features**:
  - 1000+ icons
  - Tree-shakeable
  - Customizable size and color
  - TypeScript support

### React Icons
- **Purpose**: Popular icon libraries collection
- **Features**:
  - Multiple icon sets (Font Awesome, Material Design, etc.)
  - Consistent API
  - Tree-shakeable

## Form Handling

### React Hook Form
- **Purpose**: Performant, flexible forms with easy validation
- **Features**:
  - Minimal re-renders
  - Built-in validation
  - TypeScript support
  - Easy integration with UI libraries

### Zod
- **Purpose**: TypeScript-first schema validation
- **Features**:
  - Runtime type checking
  - Form validation
  - API validation
  - Type inference

### Hookform Resolvers
- **Purpose**: Validation library resolvers for React Hook Form
- **Integration**: Seamless Zod integration

## Development Tools

### TypeScript 5
- **Purpose**: Static type checking
- **Features**:
  - Enhanced type inference
  - Better performance
  - Improved developer experience

### ESLint
- **Purpose**: Code linting and formatting
- **Configuration**: Next.js optimized rules

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── layout.tsx        # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
└── lib/                  # Utility functions
    ├── utils.ts          # General utilities
    ├── auth.ts           # Authentication logic
    └── prisma.ts         # Database client
```

## Best Practices

### Component Development
1. **Use shadcn/ui components** as base building blocks
2. **Compose components** rather than creating from scratch
3. **Follow TypeScript** strict typing
4. **Implement proper error boundaries**

### Animation Guidelines
1. **Use Framer Motion** for complex animations
2. **Keep animations subtle** and purposeful
3. **Consider performance** - avoid animating layout properties
4. **Test on different devices** for smooth performance

### Styling Approach
1. **Tailwind CSS** for utility classes
2. **CSS variables** for theming
3. **Component variants** with class-variance-authority
4. **Responsive design** mobile-first approach

## Getting Started

### Adding New Components
```bash
# Add shadcn/ui component
npx shadcn@latest add [component-name]

# Example: Add a dialog component
npx shadcn@latest add dialog
```

### Creating Animated Components
```tsx
import { motion } from 'motion'

export function AnimatedCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className="rounded-lg border bg-card p-6"
    >
      {children}
    </motion.div>
  )
}
```

## Performance Considerations

### Bundle Optimization
- **Tree shaking** enabled for all libraries
- **Dynamic imports** for code splitting
- **Image optimization** with Next.js Image component

### Animation Performance
- **Use transform properties** (translate, scale, rotate)
- **Avoid animating layout properties** (width, height, margin)
- **Use will-change** CSS property when needed
- **Test on lower-end devices**

## Browser Support
- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **ES2020+ features** supported
- **CSS Grid and Flexbox** for layouts
- **CSS Custom Properties** for theming
