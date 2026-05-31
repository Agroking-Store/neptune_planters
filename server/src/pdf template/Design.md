---
name: Architectural Elegance
colors:
  surface: '#fcf9f5'
  surface-dim: '#dcdad6'
  surface-bright: '#fcf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ef'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e4'
  surface-container-highest: '#e5e2de'
  on-surface: '#1c1c1a'
  on-surface-variant: '#444748'
  inverse-surface: '#31302e'
  inverse-on-surface: '#f3f0ec'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#79591c'
  on-secondary: '#ffffff'
  secondary-container: '#fdd188'
  on-secondary-container: '#78581b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#251a02'
  on-tertiary-container: '#94815e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdeab'
  secondary-fixed-dim: '#ebc079'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4104'
  tertiary-fixed: '#f7e0b6'
  tertiary-fixed-dim: '#dac49c'
  on-tertiary-fixed: '#251a02'
  on-tertiary-fixed-variant: '#544526'
  background: '#fcf9f5'
  on-background: '#1c1c1a'
  surface-variant: '#e5e2de'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.1em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.2'
  quote:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.6'
spacing:
  unit: 4px
  gutter: 24px
  margin-page: 64px
  section-gap: 48px
  table-cell-padding: 12px 16px
---

## Brand & Style

The design system is engineered for the high-end luxury planter industry, where the product is an architectural statement. The brand personality is authoritative, sophisticated, and timeless. It targets developers, interior designers, and luxury homeowners who value precision and craftsmanship.

The visual style is a blend of **Minimalism** and **Modern Corporate**. It prioritizes extreme legibility and structured information density. By utilizing a "No-Rounding" policy and high-contrast gold-on-dark motifs, the UI evokes the feeling of a prestige editorial catalog or a bespoke architectural blueprint. The aesthetic relies on the rhythm of lines, the weight of typography, and the luxury of empty space rather than decorative flourishes.

## Colors

The palette is rooted in a "Modern Classic" foundation. 
- **Primary Dark (#171717):** Used for primary backgrounds (headers/footers), high-level headings, and deep textural contrast.
- **Luxury Gold (#C9A15D):** Reserved for accentuation, key totals, and brand-critical elements.
- **Light Gold (#D8C29A):** Used for subtle separators, borders, and secondary accents.
- **Light Grey/Cream (#F7F4F0):** Serves as a sophisticated alternative to pure white for section backgrounds or alternating table rows.
- **White (#FFFFFF):** The primary canvas color, ensuring maximum clarity for data-rich documents like quotations.

No gradients are permitted; all color applications must be solid and flat to maintain the architectural rigor.

## Typography

This design system uses a high-contrast typographic pairing to signal luxury. 
**Playfair Display** is used for all "emotional" and "high-level" content: quotations, section headers, and the primary document title. Its serif elegance provides the premium feel.
**Inter** is the workhorse for all functional data. Its neutral, geometric construction ensures that complex tables, specifications, and bank details are scanned effortlessly.

Key typographic rules:
- Use all-caps with generous letter-spacing for labels and tertiary headings to create a "blueprint" feel.
- Large numerical values (like Grand Totals) should use Inter Bold for clarity over elegance.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy, reminiscent of a printed architectural portfolio. 
- **Margins:** Generous 64px outer margins provide "breathing room" that signals luxury.
- **Grid:** A 12-column grid is used for the header and body sections, allowing for asymmetrical arrangements (e.g., "Bill To" and "Ship To" spanning 4 columns each, leaving a 4-column gap for a brand quote).
- **Rhythm:** Vertical spacing is strictly controlled in multiples of 8px.
- **Tables:** Tables are the structural heart of the system. They feature thin, 1px horizontal dividers (#D8C29A) and no vertical lines, creating a clean, modern flow.

## Elevation & Depth

To maintain a crisp, high-end feel, this design system avoids shadows and blurs entirely. Depth is achieved through:
- **Tonal Layering:** Using `#F7F4F0` (Cream) background blocks against the `#FFFFFF` (White) canvas to group related information (e.g., the Totals block).
- **High Contrast Surfaces:** Using `#171717` (Dark) for headers and footers to "bookend" the document, creating a sense of containment and structure.
- **Rule Lines:** 1px solid lines in Luxury Gold or Light Gold are used to separate logical sections without adding visual weight.

## Shapes

The shape language is strictly **Sharp (0)**. 
- All buttons, input fields, containers, and image frames must have 0px border-radius.
- This reinforces the "architectural" and "precision-engineered" brand pillars.
- Visual interest is generated through the interplay of rectangles and text, rather than soft curves.

## Components

### Tables
- **Header:** Background `#171717`, Text `#FFFFFF` (Inter Bold, All-caps).
- **Rows:** Alternating background between `#FFFFFF` and `#F7F4F0`.
- **Dividers:** 1px solid `#D8C29A` between rows only.
- **Images:** Square frames for product thumbnails, strictly centered.

### Buttons & CTAs
- **Primary:** Solid `#171717` with `#C9A15D` text. Rectangular, no rounding.
- **Secondary:** Transparent with 1px `#C9A15D` border.

### Information Blocks (Bill To / Ship To)
- Labels should be in `#C9A15D` (Gold), uppercase, Inter Bold.
- Content should be in `#171717`, Inter Regular.

### Summary / Totals Box
- The Grand Total should be housed in a high-contrast container (Dark background with Gold text) to draw the eye immediately.
- Use horizontal rule lines to separate subtotal, tax, and grand total.

### Signature & Footer
- Footer is a full-width `#171717` bar.
- Icons should be minimal, monochromatic gold or white.