# Handoff: Bonae Tech Content Editor Redesign

## Overview
A redesigned internal tool for non-technical marketing/content staff to edit the copy on the Bonae Tech marketing site (Hero, Services, About, Contact, Site settings) in ES/EN, then review and publish changes live. Replaces an older, more utilitarian editor with a cleaner layout, inline validation, and a first-class draft → review → publish flow.

## About the Design Files
The files in this bundle are **design references built in HTML/JS** (an interactive clickable prototype with mocked local state) — not production code to copy directly. The task is to **recreate this design in the target codebase's existing environment** (e.g. React + whatever backend/CMS layer already exists) using its established patterns, data layer, and auth — or, if no environment exists yet, choose the most appropriate stack and implement there. Treat the JS logic in the prototype as a spec for state/behavior, not as code to paste in.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy are final-intent; recreate pixel-close using the codebase's existing component library where one exists. There is no bound design system for this tool (kept intentionally neutral/gray with a small brand accent) — if the target codebase has its own design system, prefer its tokens for grays/spacing/typography as long as the neutral, professional feel and the brand accent color are preserved.

## Screens / Views
Single-page app, one screen with a persistent shell and a section switcher. No routing between "pages" — everything is client-side state (`activeSection`, `locale`).

### Shell layout (1440×860 canvas in the prototype; should be responsive/full-viewport in production)
- **Top bar** (white, `1px solid #E3E6E7` bottom border, `14px 24px` padding, flex row, `justify-content: space-between`):
  - Left: 30×30px logo (7px border-radius) + two-line wordmark ("Bonae Tech · Content" 14.5px/700/#23292B, "Marketing site editor" 11.5px/#98A0A2).
  - Center: 3-step progress indicator "Draft → Review → Publish" (see Interactions below for state logic).
  - Right: save status label, "Save draft" button, divider, "Last published" timestamp, divider, 28px circular user avatar (initials, `#3F5459` bg, white text).
- **Body**: 3-column flex layout, `flex: 1`, `min-height: 0`.
  1. **Left nav** (210px fixed, white, right border `#E3E6E7`, `18px 14px` padding):
     - Locale switcher: 2-segment pill toggle (ES/EN), `#F0F1F1` track, active segment white with subtle shadow.
     - Section nav list: Hero, Services / value prop, About / team, Contact, Site settings, Advanced JSON. Each item: full-width button, 13px/600, left-aligned, small colored dot (coral `#FF6B57` when active, transparent otherwise), red error-count pill (`#FBE1E1` bg / `#C0392B` text) right-aligned when that section has validation errors. Active item background `#EEF3F3`, text `#3F5459`; inactive text `#6B7478`.
     - Bottom-pinned "Discard all drafts" secondary button.
  2. **Form area** (flex:1, scrollable, `26px 32px 60px` padding, content max-width 600px): renders the fields for whichever section is active (see per-section content below). Each field group sits in a white `cardStyle` box: `border:1px solid #E3E6E7; border-radius:10px; padding:14px;`.
  3. **Right rail** (320px fixed, white, left border `#E3E6E7`): two tabs, **Changes** (badge = pending change count, coral) and **History**. Changes tab shows: optional amber "unsaved edits" banner, optional red validation-blocking banner, a scrollable diff list, and a footer with "Approve & publish" button. History tab shows a reverse-chronological activity log (summary + timestamp + user).

### Per-section fields
- **Hero**: Badge (60 char max), Headline (90 max), Subheadline (240 max, textarea), Primary button label, Secondary button label, Trust note. All text inputs with live character counters where max is defined.
- **Services / value prop**: Eyebrow label, Section title (90 max), repeatable **Service cards** array — each card: Title (60 max) + Description (160 max, textarea), with per-card Move Up / Move Down / Remove controls and an "+ Add card" button above the list.
- **About / team**: Title (90 max), Description (300 max, textarea), repeatable **Founders** array — each row: Name (40 max) + Role (40 max) side by side + Remove button, "+ Add founder" button above list.
- **Contact**: Title, Description (240 max, textarea). Informational note that channel details (WhatsApp/email/address) live in Site settings.
- **Site settings** (not localized — shared across ES/EN): Site name (40 max), WhatsApp number, Contact email (must contain "@"), Address, Footer text.
- **Advanced JSON**: read-only `<pre>` dump of the full current draft content tree, dark background (`#23292B` bg, `#D8E0E1` text), monospace, for support/debugging only.

## Interactions & Behavior

### Draft → Review → Publish state machine
This is the core UX fix requested during design review — earlier drafts had no explicit "save" step, so live typing was indistinguishable from a reviewable draft. Final model:

1. **Typing in any field** updates in-memory `content` immediately (so the form feels responsive) but does **not** yet count as a "pending change" for review purposes. While `content` differs from `lastSavedContent`, the UI shows an amber "Unsaved edits" status next to the Save draft button, and the Changes rail shows an amber banner telling the user to save first.
2. **Save draft** button (top bar): copies `content` → `lastSavedContent`. Disabled/greyed when there are no unsaved edits. On save, sets a "Draft saved {time}" status label.
3. **Review**: the Changes rail's diff list is computed as a deep diff between `lastSavedContent` (saved draft) and `published` (last-published snapshot) — i.e. only saved changes show up for review, never raw in-progress keystrokes. Each diff row shows a humanized field path (e.g. "ES › Hero › Headline"), the old value struck through in red (`#B03434` on `#FBE9E9`), and the new value in green (`#1E6B45` on `#E4F5EC`).
4. **Publish**: "Approve & publish" button in the rail. Disabled when there are zero pending changes OR when any validation error exists anywhere (across both locales and settings). On click: `published = clone(lastSavedContent)`, and a new entry is prepended to the activity/history log with a human-readable summary of which sections changed, a timestamp, and the acting user.
5. **Discard all drafts**: resets both `content` and `lastSavedContent` back to the current `published` snapshot (i.e. throws away all unsaved and saved-but-unpublished edits).
6. **Stepper** in the top bar reflects state coarsely: step 1 ("Draft") highlighted when there are no pending (saved) changes; step 2 ("Review") highlighted once there is at least one pending change awaiting publish. Completed steps show a muted green fill.

### Validation
Inline, computed on every render (not on blur/submit):
- Required-field checks (empty/whitespace-only → error).
- Max-length checks per field (see limits above) — shown as both a live counter (`n/max`) and, once exceeded or empty, an error string under the field (11.5px, `#C0392B`, 600 weight).
- Email field requires an "@".
- Each nav item shows a count badge of unresolved errors within that section (summed across both locales for localized sections).
- Any outstanding error anywhere blocks publish, surfaced via a banner in the rail.

### Locale handling
Hero, Services, About, Contact are localized (separate ES/EN trees editable via the top-of-nav segmented toggle). Site settings and the activity log are shared/global, not per-locale.

## State Management
Suggested state shape (mirrors the prototype):
```
{
  locale: 'es' | 'en',
  activeSection: 'hero' | 'services' | 'about' | 'contact' | 'settings' | 'json',
  content: { es: {...}, en: {...}, settings: {...} },      // live editing buffer
  lastSavedContent: { es, en, settings },                   // last "Save draft" snapshot
  published: { es, en, settings },                          // last "Publish" snapshot
  activityLog: [{ summary, time, user }, ...]
}
```
- `isDirty` = `content !== lastSavedContent` (deep compare).
- `pendingChanges` = deep diff of `lastSavedContent` vs `published`.
- Real implementation should replace local state with actual persistence: draft saves should call a backend "save draft" endpoint (versioned per locale), and publish should trigger whatever mechanism pushes content live on the marketing site (rebuild, cache invalidation, CMS publish webhook, etc). Activity log should be server-sourced with real user identities, not the mocked "You".

## Design Tokens
- **Surfaces**: page bg `#EDEFEF` (canvas) / editor chrome bg `#F6F7F7`, panel bg `#fff`, borders `#E3E6E7` / `#D3D7D8` / `#D9DCDD`.
- **Text**: primary `#23292B`, secondary `#3F5459` (also used as the muted brand/dark accent for buttons, dots, avatar), tertiary/muted `#6B7478`, faint `#98A0A2`.
- **Brand accent (coral, from Bonae Tech logo)**: `#FF6B57` — used sparingly for the active-section dot, pending-count badges, and disabled/enabled primary publish button.
- **Semantic**: success/green `#1E6B45` text on `#E4F5EC` bg (border `#DCE3E3`-ish / diff additions), error/red `#B03434` / `#C0392B` text on `#FBE9E9` / `#FBE1E1` bg, warning/amber `#B5622F` text on `#FFF1EA` bg (border `#FFDCC8`).
- **Typography**: system font stack (`system-ui, -apple-system, "Segoe UI", sans-serif`). Sizes used: 19px/800 (section titles), 14.5px/700 (wordmark), 13–13.5px/600–700 (buttons, nav, inputs), 12–12.5px/600–700 (labels, secondary buttons), 11–11.5px (counters, error text, meta).
- **Radius**: 6–10px throughout (pills use full round). **Shadow**: outer canvas shadow only (`0 20px 50px -20px rgba(20,30,32,0.35)`) — no card shadows inside the app, borders instead.
- **Spacing**: 8px-ish rhythm; card padding 14px, section gaps 18–20px, page padding ~24–32px.

## Assets
- Bonae Tech logo: `assets/bonae-logo.jpg`, sourced from the user-provided logo file, used at 30×30px (top bar) with 7px border-radius. No other custom imagery — this is a form-heavy tool with no photography/illustration.

## Files
- `Content Editor.dc.html` — the interactive prototype source (template + logic class).
- `Bonae Tech Content Editor.html` — bundled, self-contained standalone version of the same prototype (open directly in a browser, no server needed).
- `assets/bonae-logo.jpg` — logo asset referenced above.
