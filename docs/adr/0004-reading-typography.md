# ADR-0004: Use Inter for Long-Form Reading Text, with a Reader Serif Option

## Status
Accepted

## Date
2026-11-08

## Context
Most of the platform is long technical reading: concept explanations, case study overviews, deep dives and model answers. Before this decision, all of that body text used **Plus Jakarta Sans**, at 15.2 to 16px.

- Plus Jakarta Sans is a geometric sans designed for branding and interface text. Its round, uniform letters work well in labels and buttons. They are less suited to long paragraphs dense with acronyms, numbers and identifiers (QPS, TTL, L4, `Il1`, `0/O`).
- Reading research finds no single font that is best for every reader. Which font reads fastest differs between people, and serif vs sans shows no consistent difference on screens. Size, line length, line spacing and clear letter shapes matter more.
- The site already loads **Newsreader**, a text serif with optical sizes, for headings.

Constraints: keep the client-side Vite and Tailwind CSS v4 architecture from ADR-0002, add no npm dependency, and keep the visual identity (logo, buttons, labels).

## Decision
1. **Default reading font: Inter** (loaded from Google Fonts, weights 400 to 700). It applies to long-form text only: `p`, `li` and `dd` inside `<main>`, except elements marked `font-mono`. The OpenType features `cv05` (tailed l), `cv08` (serifed capital I) and `zero` (slashed zero) are enabled, so `I`, `l` and `1`, and `0` and `O`, never look alike.
2. **Reader choice: Sans or Serif.** A Sans / Serif control in the navbar, next to the A-/A/A+ size control, switches long-form text between Inter and Newsreader. The choice is saved in `localStorage` (`system_design_reading_font`) and set as `data-reading-font` on `<html>`. A script in `index.html` applies it before first paint, to avoid a font switch on load.
3. **Size and measure:** long-form text is 1.0625rem (17px at the default size), with a line height of about 1.65 and lines limited to about 72 characters.
4. **Plus Jakarta Sans stays** for the brand, navigation, buttons and labels. Newsreader stays for headings.
5. **Implementation:** CSS custom properties (`--reading-font`, `--reading-font-features`) in `src/index.css`. The selector rule is unlayered, so it takes precedence over the `font-sans` utilities in Tailwind's utilities layer, without changing each component.

## Alternatives Considered

### Keep Plus Jakarta Sans for body text
- **Pros:** no change and no extra download.
- **Cons:** a geometric display face for long technical text, with no way to tell `Il1` apart.
- **Rejected:** reading quality is the core of the product.

### Newsreader (serif) as the only body font
- **Pros:** already loaded, so no extra download. A good text serif.
- **Cons:** forces one style on every reader, although the research shows the best font differs per person.
- **Rejected as the only option.** It is offered as the Serif choice instead.

### Atkinson Hyperlegible Next
- **Pros:** designed so similar letters never look alike. Strong for low-vision readers.
- **Cons:** a more distinctive look that suits a small accessibility option better than the default.
- **Deferred:** it can be added as a third reading choice later with the same mechanism.

### Self-hosting the fonts (for example with Fontsource)
- **Pros:** no third-party request, and works offline.
- **Cons:** adds npm packages and build assets. The site already loads its other fonts from Google Fonts.
- **Deferred:** move all fonts together if privacy or offline support becomes a requirement.

## Consequences

### Positive
- Long-form text is easier to read, and technical identifiers are clearer.
- Readers who prefer serif text can switch, and the choice persists.
- No component markup changes: a new paragraph in `<main>` gets the reading font automatically.

### Negative and trade-offs
- One more font download (Inter, four weights) on first visit.
- Text inside `<main>` that is a `p`, `li` or `dd` but should look like an interface label must use `font-mono`, or a non-paragraph element, to opt out.
- Newsreader has a smaller x-height than Inter, so serif text looks slightly smaller at the same size.
