# URL Example

Simple static website demonstrating ViSnap URL testing capabilities.

## What it demonstrates

This example shows:
- URL adapter configuration
- Testing multiple pages of a static site
- Different page layouts and content types
- Form elements and interactive components

## Pages included

- **Home** (`/`) - Landing page with hero section and feature cards
- **About** (`/about.html`) - Company information with stats and grid layout
- **Contact** (`/contact.html`) - Contact form and information with form elements

## How to run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   This will start a local server at `http://localhost:5173`

3. Run ViSnap tests:
   ```bash
   # Take baseline screenshots
   npm run update
   
   # Test for visual changes
   npm run test
   ```

## Configuration

The `visnap.config.ts` file is configured to test all three pages:
- Home page with hero section and feature cards
- About page with company information and statistics
- Contact page with form elements and contact information

## Learn more

See the [main README](../../README.md) for complete documentation.
