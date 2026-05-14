# Bookmark Vault Design System

This document outlines the UI/UX architecture, component usage, and styling guidelines for the Bookmark Vault frontend.

## 1. Core Philosophy
The frontend uses a modern, "Nocturne Noir" inspired design system with deep backgrounds, vibrant purple accents (`#7c6af7`), and glassmorphism elements. The goal is to provide a premium, application-like feel using smooth transitions, animated components, and highly interactive hover states.

## 2. Theme Management (Light & Dark Mode)
The application natively supports Light, Dark, and System theme preferences.
- **Provider:** The `ThemeProvider.jsx` component wraps the app and manages state via `localStorage` (key: `bookmarkvault-theme`).
- **Toggle:** Users can toggle themes using the `<ThemeToggle />` component located in the Navbar, which provides an animated sun/moon icon.
- **CSS Variables:** Colors are defined in `index.css` under the `:root` (Light mode) and `.dark` (Dark mode) selectors.

## 3. Magic UI Components
We have integrated premium components inspired by Magic UI to elevate interactivity:

### 3.1 `AnimatedGridPattern.jsx`
- **Purpose:** Provides a subtle, animated grid background that gives the application depth.
- **Usage:** Positioned absolutely or fixed at the root level of pages (e.g., `HomePage`, `LoginPage`) with `pointer-events-none` to prevent interaction blocking.

### 3.2 `MagicCard.jsx`
- **Purpose:** A container component that tracks the mouse cursor to display a soft, radial gradient spotlight effect on hover.
- **Usage:** Wraps individual items like `BookmarkCard` to draw focus to the element the user is interacting with.

### 3.3 `ShimmerButton.jsx`
- **Purpose:** A primary call-to-action button featuring a continuous, animated shimmer effect around its border.
- **Usage:** Used for major actions such as the "Sign In" / "Create Account" button on the Login page.

## 4. Typography & Layout
- **Fonts:** 
  - Sans-serif: `Manrope` (Default UI text)
  - Serif/Display: `EB Garamond` (Headings, Branding)
  - Monospace: `DM Mono` (Code blocks, Tags)
- **Spacing:** Structured using tailwind utility classes heavily relying on `--gutter` and `--card-gap`.

## 5. Dropdown Menus
- Built using Radix UI primitives (`@radix-ui/react-dropdown-menu`).
- The User Profile dropdown uses scale and fade entry animations (`animate-in slide-in-from-top-2`) and features an avatar placeholder and structured sections (Profile, Billing, Settings, Sign Out).
