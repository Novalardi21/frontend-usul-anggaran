---
name: POLINDRA Anggaran Modern
colors:
  surface: '#f9f9ff'
  surface-dim: '#d1daf4'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d9e2fc'
  on-surface: '#121b2e'
  on-surface-variant: '#444651'
  inverse-surface: '#273044'
  inverse-on-surface: '#edf0ff'
  outline: '#757683'
  outline-variant: '#c5c5d3'
  surface-tint: '#4359ac'
  primary: '#062478'
  on-primary: '#ffffff'
  primary-container: '#263d8f'
  on-primary-container: '#9aadff'
  inverse-primary: '#b7c4ff'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#14276c'
  on-tertiary: '#ffffff'
  tertiary-container: '#2e3f83'
  on-tertiary-container: '#9dadf9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#294092'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#b8c4ff'
  on-tertiary-fixed: '#001454'
  on-tertiary-fixed-variant: '#314286'
  background: '#f9f9ff'
  on-background: '#121b2e'
  surface-variant: '#d9e2fc'
  bg-app: '#F4F6FA'
  surface-white: '#FFFFFF'
  surface-muted: '#F8FAFC'
  border-subtle: '#E2E8F0'
  primary-soft: '#E9EDFF'
  text-secondary: '#64748B'
  text-muted: '#94A3B8'
  success-emerald: '#0F9F78'
  success-soft: '#DDF8EF'
  warning-amber: '#D97706'
  warning-soft: '#FFF2D8'
  danger-red: '#DC525D'
  danger-soft: '#FDE8EA'
  info-blue: '#2877C7'
  info-soft: '#E5F2FF'
typography:
  display-metric:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  display-metric-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-table:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.25rem
  margin-desktop: 1.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style
The design system serves as an institutional financial administration platform tailored for state higher education governance (Politeknik Negeri Indramayu). The interface conveys regulatory rigor, auditability, institutional stability, and modern administrative efficiency. The target audience includes budget operators, department heads (Pimpinan Jurusan/Unit), internal auditors (SPI), and financial authorization officers (KPA).

The visual aesthetic fuses **Corporate / Modern FinTech** precision with clean, academic institutional sobriety. Drawing structural clarity from contemporary banking dashboards, it pairs an organized left navigation rail, soft metric summary cards, and dense, tabular-ready data surfaces. Decorative frills, intense glassmorphism, and skeuomorphic ornaments are removed in favor of high-contrast readability, calm blue-gray atmospheric surfaces, hairline structural dividing lines, and explicit visual validation states.

## Colors
The palette utilizes an authoritative Navy (`#263D8F`) as the primary anchor, supported by an energetic Indigo (`#4F46E5`) for accents, trend curves, and active state highlights. The canvas is grounded in a cool, low-fatigue slate tint (`#F4F6FA`), allowing pure white (`#FFFFFF`) card surfaces to pop with distinct clarity.

Every semantic status is paired with a matched soft-background tier to preserve accessible contrast and unambiguous audit trails:
- **TERVALIDASI (Validated)**: Emerald `#0F9F78` on soft surface `#DDF8EF`.
- **KOREKSI (Correction Required)**: Amber `#D97706` on soft surface `#FFF2D8`.
- **DALAM_PROSES (In Review)**: Cobalt `#2877C7` on soft surface `#E5F2FF`.
- **DEFISIT / ERROR (Critical / Rejected)**: Crimson `#DC525D` on soft surface `#FDE8EA`.
- **DRAF (Draft)**: Neutral slate `#64748B` on `#F1F5F9`.

All nominal budget quantities and critical data values rely on deep navy-charcoal `#172033` for maximum legibility against white containers.

## Typography
The system is standardized entirely on **Inter** to ensure maximum glyph clarity across complex data matrices, nested form tables, and dense metrics. 

### Tabular Numerics Mandate
All numeric nominals (e.g., `Rp 1.450.000.000`), budget percentages, transaction IDs, MAK codes, and date stamps must explicitly declare `font-variant-numeric: tabular-nums` (or CSS class `.tabular-nums`). This guarantees vertical column alignment across thousands of financial rows without ragged jitter.

Headings feature tight letter-spacing to command administrative focus, while helper labels and table captions use slightly elevated letter spacing to sustain readability at 11–12px.

## Layout & Spacing
The layout follows a persistent vertical dual-rail application structure:
- **Sidebar**: Fixed `248px` wide on desktop screens (collapsible to `80px` icon rail for compact viewing).
- **Topbar**: Fixed `72px` height containing academic period selectors, search, notification badges, and active session identity.
- **Main Canvas**: A 12-column grid structured for high-density administrative oversight.

### Responsive Breakpoints & Adapters
- **Desktop (≥ 1280px)**: 12-column grid, `28px–32px` page padding (`margin-desktop`), `24px` gutter. Financial summary cards display 4 across.
- **Tablet (768px – 1279px)**: 6-column grid, `20px` page padding (`margin-tablet`), `16px` gutter. Sidebar converts to an off-canvas drawer or collapsed icon rail. Cards stack 2x2.
- **Mobile (< 768px)**: 1-column stack, `16px` screen margin (`margin`), with horizontal touch scroll enabled on complex tables.

Section vertically separates by `24px–28px`. Inner card groups and input form stacks adhere strictly to the 4px baseline rhythm using multiples of `8px` (`space-sm`), `12px` (`space-md`), and `16px` (`space-lg`).

## Elevation & Depth
Depth is deliberately disciplined to avoid distracting visual weight in dense financial workspaces. The hierarchy uses two layered strata:

1. **Base Cards & Data Workbenches**: Elevated exclusively using a clean 1px hairline perimeter border (`#E2E8F0`) matched with an ultra-diffuse ambient shadow: `0 4px 18px rgba(23, 32, 51, 0.04)`.
2. **Interactive Overlays & Flyouts**: Modals, multi-tier MAK selection popovers, and action dropdowns break surface plane with a focused floating shadow: `0 12px 36px rgba(23, 32, 51, 0.12)`.

Heavy blur filters, glass translucency, and layered skeuomorphic glows are prohibited. Depth communicates strictly through containment borders and resting-versus-hover tone changes.

## Shapes
The shape language combines friendly fintech curvature with clean enterprise utility (`roundedness: 2`):
- **Inputs, Buttons, and Status Chips**: Standardized at `8px` (`rounded-sm`), delivering compact, crisp tap-targets.
- **Inner Sub-containers, Tooltips, and Alert Banners**: `12px` (`rounded-md`).
- **Dashboard Metric Cards, Workbenches, and Modals**: `16px` to `18px` (`rounded-lg`), establishing smooth grouping frames that mirror contemporary executive dashboards.
- **Pills**: Reserved solely for workflow counters and badge indicators (`rounded-full`).

## Components

### Buttons
- **Primary Action**: Solid `#263D8F` background with `#FFFFFF` text, `8px` border radius, padding `10px 18px`. Hover shifts to `#1D2F73`. Active states trigger a micro 0.98 scale transform.
- **Secondary / Outline**: `#FFFFFF` surface with `1px solid #E2E8F0` border and `#172033` text. Hover shifts to `#F8FAFC` with `#263D8F` border tint.
- **Destructive**: `#DC525D` text on `#FDE8EA` soft ground, elevating to solid `#DC525D` with `#FFFFFF` text for permanent budget deletion confirmations.
- **States**: Buttons undergoing server validation must show an integrated spinner while locking pointer events to prevent double submission.

### Status Chips & Workflow Badges
- Height: `26px`; typography: `label-sm` (uppercase / semibold); padding: `4px 10px`; radius: `9999px` (pill).
- **TERVALIDASI**: Text `#0F9F78`, background `#DDF8EF`, border `1px solid rgba(15, 159, 120, 0.2)`. Preceded by a checkmark icon.
- **KOREKSI**: Text `#D97706`, background `#FFF2D8`, border `1px solid rgba(217, 119, 6, 0.2)`. Preceded by an alert-circle icon.
- **DALAM_PROSES**: Text `#2877C7`, background `#E5F2FF`, border `1px solid rgba(40, 119, 199, 0.2)`. Preceded by a clock icon.

### Form Inputs & Selectors
- Standard height: `42px`; radius: `8px`; background: `#FFFFFF`; border: `1px solid #E2E8F0`; typography: `body-md`.
- **Focus**: Border transitions to `#4F46E5` accompanied by an ambient ring: `0 0 0 3px rgba(79, 70, 229, 0.12)`.
- **Financial Input Fields**: Formatted with permanent prefix `Rp` in `#64748B`, right-aligned numeric strings, and automated thousands grouping delimiters.

### Metric Cards (`StatCard`)
- Container: Surface `#FFFFFF`, border `1px solid #E2E8F0`, corner radius `16px`, padding `20px 24px`.
- Visual hierarchy: Upper label (`label-md` in `#64748B`), centered hero metric (`display-metric` in `#172033` with tabular nums), and bottom helper trend/allocation meter showing percentage of total ceiling (Pagu).

### Data Tables
- Header: Background `#F8FAFC`, uppercase `11px` semibold `#64748B`, height `44px`, bottom border `1px solid #E2E8F0`.
- Rows: Background `#FFFFFF`, height `52px`, hover highlight `#F8FAFC`, bottom border `1px solid #E2E8F0`.
- Text columns left-aligned; all nominal amounts, quantities, and unit prices aligned strictly to the right.