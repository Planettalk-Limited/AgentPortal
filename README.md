# PlanetTalk Agent Portal

A comprehensive agent management portal for PlanetTalk telecommunications agents, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Real-time Analytics**: Track performance with comprehensive analytics and reporting
- **Agent Management**: Efficiently manage your entire agent network
- **Financial Analytics**: Monitor revenue, commissions, and financial performance
- **Customer Relationship Management**: Manage customer relationships and interactions
- **Communication Tools**: Built-in tools to stay connected with agents and customers
- **Advanced Reporting**: Generate detailed reports and insights

## Design Elements

This portal incorporates design elements from the main PlanetTalk website, including:

- **Color Scheme**: PlanetTalk turquoise (#24B6C3) and dark gray (#404653) branding
- **Typography**: Roboto font family for consistency
- **Component Patterns**: Card-based layouts, gradient backgrounds, and modern UI elements
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout component
│   └── page.tsx        # Home page
├── components/         # Reusable React components
│   ├── Header.tsx      # Navigation header
│   ├── Hero.tsx        # Hero section
│   ├── Features.tsx    # Features showcase
│   └── Footer.tsx      # Footer component
├── lib/                # Utility functions and configurations
└── styles/             # Global styles and CSS
    └── globals.css     # Global CSS with Tailwind
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom PlanetTalk theme
- **Linting**: ESLint with Next.js configuration
- **Fonts**: Google Fonts (Roboto)

## Color Palette

- **Primary Turquoise**: #24B6C3
- **Dark Gray**: #404653
- **Light Gray**: #9D9C9C
- **Various shades**: 50-950 for each color

## Development Notes

- The project uses the new Next.js App Router
- TypeScript is configured with strict mode
- Tailwind CSS includes custom PlanetTalk branding
- Components are designed to be responsive and accessible
- The design system follows PlanetTalk's visual identity

## License

This project is proprietary software owned by PlanetTalk Limited.
