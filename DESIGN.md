# UI/UX Design System: Robotics & Software Inventory Management

## Overview
This document outlines the frontend design language, component architecture, and styling principles for the Inventory Management web application. The design focuses on a modern, "glassmorphic" aesthetic that feels both premium and highly responsive.

## Technology Stack
- **Framework**: Next.js (React)
- **Styling**: Tailwind CSS v4 & custom global CSS (`globals.css`)
- **Icons**: Lucide React
- **Authentication Flow**: Next-Auth

## Core Design Principles
1. **Glassmorphism & Depth**: The application makes extensive use of blurred, semi-transparent backgrounds to create a sense of depth and hierarchy.
2. **Dynamic Backgrounds**: Subtle, animated mesh gradients float in the background, providing a lively yet unobtrusive ambiance.
3. **Typography**: 
   - *Primary/Sans*: **Inter** is used for UI elements, dashboards, and standard text for its excellent legibility.
   - *Secondary/Serif*: **Noto Serif** (italicized) is used for artistic headings and branding statements, particularly on the sign-in page.

## Color Palette
The primary brand colors are centered around a cool, professional blue spectrum:
- **Brand 50**: `#eff6ff`
- **Brand 100**: `#dbeafe`
- **Brand 500**: `#185FA5` (Primary Actions)
- **Brand 600**: `#0C447C`
- **Brand 700**: `#082f56`

The application fully supports dark mode, utilizing `--background` and `--foreground` CSS variables to seamlessly transition between a light slate background (`#f8fafc`) and a deep dark mode background (`#020617`).

## Core CSS Utilities
To maintain consistency, the following custom utility classes are defined in `globals.css`:
- `.app-bg`: The base animated background with floating mesh gradients (`meshFloat1`, `meshFloat2`).
- `.glass-card`: A standard content container with a 16px backdrop blur, subtle borders, and inner shadows.
- `.glass-panel`: A higher-elevation container (20px blur) used for prominent UI elements like the `TopBar`.
- `.glass-input`: Form input styling with transparent backgrounds, 8px blur, and subtle inner shadows.

## Key Views & Layouts

### 1. Authentication / Sign-In
A split-panel design (`.signin-layout`):
- **Artistic Panel (Left)**: Only visible on larger screens. Features a dark `#0a0a0a` background, neon floating blurs (pink, blue, magenta), grain overlays, and serif typography.
- **Form Panel (Right)**: Contains the sign-in form wrapped in a glassmorphic container. Includes floating labels, smooth focus states, and OAuth integration (GitHub).

### 2. Dashboard TopBar
A sticky, high-elevation `.glass-panel` that provides navigation across the application:
- Features a glowing brand logo.
- Renders tab buttons (`Inventory`, `Projects`, `Requests`, `Lending`, `History`, `Users`) inside a `.glass-input` track.
- Active tabs scale up slightly (`scale-105`) and use brand colors, while inactive tabs have hover transitions.
- Includes a dedicated, red-accented "Sign Out" button.

### 3. Core Dashboard Tabs
Content is generally rendered within `.glass-card` wrappers, providing a unified, floating appearance over the animated `.app-bg`. This applies to standard views like Inventory, Projects, Requests, and Lending.

### 4. Admin Dashboard (User Management)
The `UsersTab` component serves as the central hub for administrative tasks, adhering to the glassmorphic theme with specific data-presentation elements:
- **Header Panel**: A `.glass-panel` acts as the header, featuring the section title, subtitle, and a prominent "Add User" primary action button (`bg-brand-500` with hover lift).
- **Data Table**: Rendered in a responsive container (`overflow-x-auto`), the table uses semantic borders (`divide-slate-100 dark:divide-slate-800/50`) and uppercase tracking headers for legibility.
- **Role Badges**: Visual indicators for user roles using color psychology:
  - **Admin**: Red-tinted badges for elevated access alerts (`bg-red-50 text-red-700` in light mode, dark variants supported).
  - **Inventory Manager**: Blue-tinted badges aligning with the core brand palette.
  - **Member**: Neutral slate badges for standard users.
- **Action Buttons**: Row-level actions (Edit, Delete) use icon-only buttons that reveal distinct hover colors (brand blue for edit, red for delete) against soft background tints.
- **Empty State**: Displays a centralized icon (`UserCog`) with muted text when no data is present, preventing a stark empty space.
## Micro-Interactions
- **Hover Effects**: Buttons and cards slightly scale up and shift colors.
- **Form Inputs**: Floating labels that smoothly transition above the input field upon focus or when text is present.
- **Toasts**: Animated entry (`toastEnter`) and exit (`toastExit`) for user notifications.
