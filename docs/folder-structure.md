# ROVOCS Web App – Recommended File & Folder Structure

src/
├── app/
│ ├── layout.tsx # Root layout, global providers
│ ├── globals.css # Tailwind + custom styles
│ ├── page.tsx # Landing / marketing page
│ ├── dashboard/ # Auth-protected data views
│ │ ├── page.tsx
│ │ └── reports/[id]/page.tsx
│ ├── auth/
│ │ ├── login/page.tsx
│ │ └── signup/page.tsx
│ ├── api/ # Next.js Route Handlers
│ │ ├── auth/route.ts # Sign in/out
│ │ ├── readings/route.ts # Receive ESP32 sensor data (POST)
│ │ └── reports/route.ts # Export reports
│ └── device/
│ └── connect/page.tsx # Device pairing UI
│
├── lib/
│ ├── prisma.ts # Prisma client instance
│ ├── auth.ts # Auth helpers (NextAuth)
│ └── mqtt.ts # MQTT / WebSocket client (ESP32)
│
├── components/
│ ├── charts/ # Reusable graph components
│ ├── tables/ # Data tables
│ ├── sensor-cards/ # Small metric cards (TVOC, eCO₂…)
│ └── ui/ # shadcn/ui components (Button, Card, Modal, etc.)
│
├── hooks/ # Custom React hooks
├── types/ # TypeScript types/interfaces
├── utils/ # Formatters, constants
├── prisma/
│ └── schema.prisma # Database schema
│
└── tests/ # Jest/Playwright tests
├── unit/
└── e2e/

public/
├── icons/
└── manifest.json # PWA metadata


## Key Points
- **API routes** handle device → server data posting and report exporting.
- **MQTT/WebSocket** used for live readings.
- **shadcn/ui** components for consistent, accessible UI design.
- **Framer Motion** for smooth animations and transitions.
- Mobile-first Tailwind design for responsiveness.