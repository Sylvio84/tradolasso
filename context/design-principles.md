# SaaS Dashboard Design Principles — Refine.dev + Ant Design (Modern Linear/Stripe Style)

## I. Core Product Design Principles
1. **Users First** — simple workflows, essential actions visible, minimal friction.  
2. **Modern Minimalism** — clean interface, neutral palette, generous whitespace.  
3. **Consistency** — rely heavily on Ant Design tokens (colors, spacing, radius).  
4. **Clarity & Efficiency** — scannable information, short titles, readable tables.  
5. **Accessibility** — WCAG AA, visible focus states, sufficient contrast.  
6. **Fast Feedback** — skeletons, loading states, fast transitions.

---

## II. Ant Design Theme (Tokens) — Modern SaaS Overrides

### Color Palette
- **Primary**: a single deep accent (e.g., dark blue/gray), used sparingly.  
- **Neutrals**: layered grayscale (very light grays + cool grays).  
- **Semantic colors**: desaturated tones for success/warning/error.

### Border Radius
- `borderRadius`: **8–10px**  
- Soft, modern rounding on cards, inputs, buttons, modals.

### Spacing
- Base spacing unit: **8px**  
- Generous padding (16–24px) on cards and sections.

### Typography
- Low-contrast, understated headings  
- Font weights: Regular / Medium / Semibold

---

## III. Layout Structure (Refine + AntD)

### Overall Layout
- Persistent left sidebar  
- Minimal top bar (search, profile, global actions)  
- Wide, spacious content area  
- Sections grouped into clean cards (light background, soft radius)

### Responsiveness
- AntD grid system for consistent layout  
- Clean alignment rules  
- Vertical stacking on mobile

---

## IV. Components Usage Guidelines

### Buttons
- **Primary** used sparingly  
- **Default** as the main button type  
- **Ghost / Text** for secondary actions  

### Forms
- AntD Form with generous spacing  
- Short, clear labels  
- Minimal helper text  
- Subtle validation messages

### Cards / Panels
- Soft radius  
- Very light or no shadow  
- Neutral background  
- Padding 16–24px

### Tables
- Bold, dark-gray headers  
- Comfortable row height  
- Clear sorting / filtering controls  
- Subtle row hover  
- Row actions as minimal icons  
- Pagination always visible  
- Works naturally with Refine `<List>` and `<Table>`

### Modals
- Clean, quiet design  
- Plenty of whitespace  
- Buttons aligned right  

### Tags / Badges
- Desaturated colors  
- Clear status indication, without bright tones

### Tooltips
- Short and to the point  
- Used sparingly

---

## V. Interaction Design

- Fast animations: **150–200ms**  
- Subtle hover states (light background/radius changes)  
- Skeletons for page-level loads  
- Spinners only for inline operations  
- `message.success` and `message.error`: brief and unobtrusive

---

## VI. Module-Specific Patterns

### A. Media Moderation
- Grid or list with large previews  
- Quick actions (Approve / Reject)  
- Subtle status badges (Pending / Approved)  
- Bulk actions supported  
- Optional keyboard shortcuts

### B. Data Tables (CRUD)
- Controls visible above the table  
- Simple filtering (Select / Input)  
- Global search  
- Optional inline editing  
- Expandable rows for detail views  
- Fully compatible with Refine hooks

### C. Settings / Configuration Panels
- Logical grouping of settings  
- Tabs or accordions  
- Short helper text  
- “Reset to defaults” option  
- Subtle toast notifications on save

---

## VII. Engineering Guidelines (LLM/Claude Code Ready)

1. **Do not rebuild a custom design system.**  
   → Use AntD + Refine as the single source of truth.

2. **Styling should rely on:**
   - Ant Design tokens  
   - Light CSS-in-JS where needed  
   - Avoid Tailwind (unnecessary with AntD 5)

3. **Refine workflow best practices:**
   - CRUD: `<List>`, `<Create>`, `<Edit>`, `<Show>`  
   - Tables: AntD `<Table>` + `useTable()`  
   - Forms: AntD `<Form>` + `useForm()`

4. **LLM-friendly project structure:**
   - Small, clean components  
   - Business logic in custom hooks  
   - `/components/layout` for layout structure  
   - `/pages/*` for domain modules
