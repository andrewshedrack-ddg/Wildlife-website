# WildGuard Society — Design System & Layout Patterns

**Inspired by**: National Geographic, WWF, Chester Zoo, Vantara, Search for Lost Species, Salish Sea Wildlife  
**Date**: August 2026  
**Version**: 2.0  

---

## 1. Design Principles

### 1.1 Core Pillars (from research)

| Principle | Source | Implementation |
|-----------|--------|----------------|
| **Content-first, interface gets out of the way** | NatGeo, WWF | Minimal chrome, image-led layouts, interfaces that fade when content is center stage |
| **Cinematic storytelling** | NatGeo Into Amazon, Vantara | Full-bleed images, scroll-triggered reveals, parallax depth, dark backgrounds |
| **Sense of abundance** | Chester Zoo (Netflix-inspired) | Infinite carousels, interactive video cards, full-screen galleries |
| **Emotional connection through imagery** | WWF, Lilongwe Wildlife Trust | Bold wildlife photos, earthy tones, statistics + stories |
| **Exploratory interaction** | Vantara, Salish Sea | Interactive maps, habitat explorer, identification tools |
| **Accessibility-first** | WWF-US redesign | Semantic HTML, keyboard nav, screen reader, proper contrast |
| **Earth-toned trust** | WWF, Vantara | Greens, browns, blues convey nature + reliability |
| **Modular & educational** | Search for Lost Species, Vantara | Card systems for dense info, taxonomy visualization |

### 1.2 Our Design Principles (adapted for WildGuard)

1. **Let wildlife be the hero** — Images and photography always center stage
2. **Discovery through exploration** — Users discover content naturally, like walking through a reserve
3. **Education without overwhelm** — Complex biodiversity data presented as clean, modular cards
4. **Action-oriented** — Every section invites the user to do something (scan, donate, learn, join)
5. **Mobile-first, immersive across devices** — Fluid typography, responsive grids, touch targets

---

## 2. Color System

### 2.1 Primary Palette (Dark Mode — Default)

```
--primary:           #1b5e40    Forest green (brand anchor)
--primary-dark:      #0a2e1f    Deep forest (headers, footers)
--primary-light:     #2d8a5e    Bright foliage (links, accents)
--caron:             #d4a017    Warm gold (CTAs, highlights)
--accent-hover:      #c8960copa    Darker gold (hover states)
--dark:              #0a1a12    Canvas base (near black)
--darker:            #050e09    Deep base (modal backgrounds)
--light:             #f5f5f0    Off-white text
--lighter:           #ffffff    Pure white
--text:              #d4d4d0    Body text
```

### 2.2 Light Mode (Forest Mode — inspired by Chester Zoo)

```
--bg-light:          #f4f1e8    Warm paper base
--bg-surface:        #ffffff    Cards
--text-primary:      #1a1a14    Body text
--text-secondary:    #5c5c46    Subtext
--border-light:      rgba(0,0,0,0.08)
```

### 2.3 Opacity Overlay System

```
--overlay-strong:    rgba(5, 14, 9, 0.92)    Full section overlays
--overlay-mid:       rgba(5, 14, 9, 0.85)    Cards/sections
--overlay-soft:      rgba(5, 14, 9, 0.60)    Subtle overlays
--glass-bg:           rgba(255,255,255,0.04)  Glass card background
--glass-border:       rgba(255,255,255,0.08)  Glass borders
--accent-glass:      rgba(212,160,23,0.12)    Gold glass
```

---

## 3. Typography

### 3.1 Font Stack

```
--font-heading:  'Playfair Display', Georgia, 'Times New Roman', serif
--font-body:    'Inter', 'Segoe UI', system-ui, sans-serif
--font-mono:   'JetBrains Mono', 'Fira Code', monospace
```

### 3.2 Fluid Type Scale (using CSS clamp)

```
--text-xs:    clamp(0.75rem, 1vw + 0.25rem, 0.875rem)    UI labels
--text-sm:    clamp(0.85rem, 1vw + 0.3rem, 0.95rem)      Body small
--text-base:  clamp(0.95rem, 1.2vw + 0.3rem, 1.1rem)   Body default
--text-lg:    clamp(1.05rem, 1.5vw + 0.3rem, 1.25rem)  testimonials/lede
--text-xl:    clamp(1.2rem, 2vw + 0.4rem, 1.5rem)      Card titles
--text-2xl:   clamp(1.5rem, 3vw + 0.5rem, 2.2rem)     Section headings
--text-3xl:   clamp(2rem, 5vw + 0.5rem, 3.5rem)       Hero titles
--text-4xl:   clamp(2.5rem, 7vw + 0.5rem, 5rem)        Stat values
```

### 3.3 Weight Mapping

| Weight | Headings | Body |
|--------|----------|------|
| 300    | —        | Lede (light text) |
| 400    | Normal heading | Default body |
| 500    | —   | Medium emphasis |
| 600    | Bold heading + nav | Button weight |
| 700    | Hero heading | Strong emphasis |

---

## 4. Component Library

### 4.1 Header (`site-header`)
- **Inspiration**: Ches Zoo collapsed booking bar + Nat geography nav simplification  
- **Layout**: Fixed, floating pill (glass-morphism), centered
- **States**: Default / scrolled (adds shadow) / transparent
- **Mobile**: Hamburger → full-screen dropdown with optimized scrolling (WWF insight)

### 4.2 Background Slideshow (`page-slideshow`)
- full-viewport fixed background, 5 eco-system images
- Gradient overlay: `rgba(0,0,0,0.55) → rgba(0,0,0,0.25) → rgba(0,0,0,0.65)`
- Transition duration: 2.5s CSS cross-fade

### 4.3 Hero Section Template (`hero`)
- Full-viewport height, dark overlay
- Eyebrow badge (accent) → Headline (display font) → Subheadline (body) → CTA
- Example layout:

```
<span class="eyebrow">Youth-Led Environmental Conservation</span>
<h1>We Are Guardians of Nature</h1>  
<p>WildGuard Society brings together young people...</p>
<a href="#" class="cta-button">CTAs →</a>
```

### 4.4 Card Grid (`card-grid`)
- Responsive: `repeat(auto-fit, minmax(260px, 1fr))`
- Variants:
  - **`.card`** — Image top + body (species, categories)
  - **`.feature-card`** — Icon + heading + text (conservation initiatives)
  - **`.stat-card`** — Metric + label (impact statistics)

### 4.5 Horizontal Checkout Ads / Infinite Carousel (Chester Zoo inspiration)
- Horizontal scroll on mobile
- Smooth CSS `scroll-snap-type: x mandatory`
- Arrow controls to advance
- Used for "Related Species" and "Explore More"

### 4.6 Search & Filter Bar (WWF pattern)
```
[🔍 Search input] | [Category select] | [Status select] | [Sort by]
```
- Real-time filtering via JavaScript
- Consistent across library and scan

### 4.7 Form Components
- Text inputs, textarea-, selects, toggle switches
- Password strength meter
- Validation states

### 4.8 Footer Pattern (Nat Geo, WWF)
- 4-column grid: Brand — Explore — Get Involved — Contact
- Social buttons (accent on hover)
- Dynamic year `[data-current-year]`

### 4.9 Book Reader Modal
- Full screen overlay with backlight
- Book-spine-effect inside modal (library.css already implemented)
- Close button, access from books grid

### 4.10 Status badges (Conservation Status)
- variations: Least ‖ concern, Near Threatened, Vulnerable, Endangered, Critically Endangered (same as IUCN Red List)
- Rounded pill style with colored background and border

---

## 5. Layout Patterns Research Integration

### 5.1 From National Geographic
| Pattern | Application in WildGuard |
|---------|--------------------------|
| Layered scroll reveals (Into Amazon) | Background images shift on scroll, parallax |
| Content clusters ("hubs") | Library filters and category pages |
| Simple navigation → mega menu | Current flat nav — no mega needed (5 pages) |
| Personalization based on detection | Later: "Because you scanned elephant..." recommendations |

### 5.2 From WWF: 
| Pattern | Application in WildGuard |
|---------|--------------------------|
| Consistent Donate + Adopt calls | Already in header/CTA bar |
| Earthy color phosphate | Already using greens + golds |
| Clean typography | Already using Inter + Plato |
| Motion-filled thumbnail grids | Already in library page |
| Bird-like/eco-friendly interactive maps | Added to Parks section |

### 5.3 From Chester Zoo 
| Pattern | Application |
|---------|-------------|
| Dark "forest mode" palette | Already implemented (dark ground in code) |
| "Streaming"-inspired abundance | Commit to library infinite scroll |
| Collapsible persistent booking bar | Not applicable (no bookings) |
| Searchable catalogue of animals | Library page (already implemented) |

### 5.4 From Vantara
| Pattern | Application |
|---------|-------------|
| Cinematic full-screen hero | Already implemented in hero |
| Modular card system for dense info | Library cards |
| Illustrated 360 habitat maps | Parks section (static maps) |
| Interactive markers | Species detail popovers |

### 5.5 From Search for Lost Species
| Pattern | Application |
|---------|-------------|
| "Most Wanted" curation style | Featured species at hero level |
| Interactive global map | Could add for "Ecoregions" section |
| Rediscovery tracking | Not applicable |

---

## 6. Layout Grid

### 6.1 Base Grid

```
.container {
  max-width:   1200px;
  margin:      0 auto;
  padding:     0 2rem;
}
```

### 6.2 Section Padding

```
section {
  padding: 5rem 0; // desktop
}
section: first-child  →  padding-top: 2rem;
@media (max < 768px)    →  padding-top: new-rem;
```

### 6.3 Responsive Breakpoints (updated from single 768px)

| Breakpoint | Design for |
|------------|-----------|
| 480px     | Mobile (portrait) |
| 768px     | Tablet |
| 1024px    | Small desktop / landscape tablets |
| 1200px    | Desktop (max-content width) |
| 1400px+   | Ultra-wide |

### 6.4 Common Grid Patterns

```css
.grid-2 { grid-template-columns: 1fr 1fr; }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.grid-hero{ display:grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
```

---

## 7. State & Interaction Patterns

### 7.1 Hover States
- Cards: Light background + transform translateY(-5px) + shadow on
- Buttons: Transition 250ms ease-out
- Links: Accent color underline

### 7.2 Focus States
- Visible focus ring (3px accent color): necessary for keyboard navigation

### 7.3 Loading States
- Scan page: Animated scanner + loading text spinner
- Library: Skeleton cards before content load

### 7.4 Empty States
- Library filter returns 0 results → "No species found matching your criteria" + clear filter button

### 7.5 Error States
- Form validation: Red border + message + field label color
- API errors: toast notification (red)

---

## 8. Accessibility Standards

### 8.1 WCAG 2.1 AA Requirements 0001

- **Contrast ratio**: 4.5:1 for text (already checked — our dark text on light has about 15:1)
- **Input labels**: All form inputs have labels via `<label>` or `aria-label`
- **Keyboard**: All interactive elements reachable by Tab
- **Focus**: Focus-visible outline for keyboard users
- **Screen reader**: Semantic HTML, skip-to-content links
- **Reduced motion**: Prefers-reduced-motion query (stop loading fling animations)
- **Landmarks**: main, nav, header, footer, section properly used
- **Aria**: aria-expanded for dropdowns, aria-modal for modals, aria-live for scan results

### 8.2 Complex Layout Check Required (Before Production)
- [ ] Scrollable infinite carousel must have skip links
- [ ] Modals and overlays must trap focus

---

## 9. Performance Budget

| Metric | Target |
|--------|--------|
| Largest Contentful Pairiv | &lt; 1.2 loading seconds |
| Total blocking time | &lt; 250ms |
| Cumulative Layout Shift | &lt; 0.1 |
| Image sizes &lt; | 500KB each (WebP preferred) |
| Fonts &lt; | 3 total files (Google Fonts) |
| JS Bundle total &lt; | 100KB |

### 9.1 Implementations
- All images: lazy loading (loading="lazy")
- CSS: no blocking loading (styles inlined for critical CSS)
- JS: deferred (defer) load
- Service Worker (already exists) for repeat visits

---

## 10. Design Tokens (Generated CSS Variables)

Already implemented in `css/style.css` section. Here extended:

```css
--radius:     8px;
--radius-lg:  16px;
--shadow:     0 4px 20px rgba(0,0,0,0.15);
--shadow-lg:  0 10px 40px rgba(0,0,0,0.25);
--transition: all 0.responseease;
```

---

## 11. Implementation Roadmap

### Completed
- [x] Dark mode palette
- [x] Card system with glassmorphism
- [x] Fixed header with slideDown
- [x] Form components
- [x] Background slideshow
- [x] Language selector
- [x] Footer layout

### In Progress (This Build)
- [ ] Modular CSS split (design tokens, layout, components, pages)
- [ ] Add dark/light mode toggle (Forest Mode)
- [ ] Added scroll-triggered animation for cards
- [ ] Better responsive breakpoints
- [ ] Infinity scroll on library
- [ ] Interactive park card (static images)
- [ ] Species identification wizard (scan page)
- [ ] ARIA improvements throughout

### Future
- [ ] PWA fully
- [ ] Play integration with real AI model
- [ ] Interactive habitat map (mapbox)
- [ ] GBIF/iNaturalist API integration
- [ ] User personalization (species newsletters)
- [ ] Opt-in newsletter integration

---

## 11. File Organization After Modularization

```
css/
├── tokens.css          # Design tokens (CSS variables)
├── reset.css           # Reset & base
├── layout.css          # Grid, container, section helpers
├── components.css       # Cards, forms, buttons, badges
├── header.css          # Header & nav
├── footer.css          # Footer
├── hero.css            # Hero and page banner
├── slideshow.css       # Background slideshow
├── library.css         # Library & book styles
├── scan.css            # Scan page styles
├── profile.css         # User pages
├── admin.css           # Admin portal styles
└── utilities.css       # Helpers: visibility, spacing, text
```

*Last updated: August 5, 2026*