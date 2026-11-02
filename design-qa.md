# Organization finances — design QA

final result: passed

## Visual target and scope

Source visual truth: the user-provided inline wireframe in this conversation (Yura Luks / Финансы / История операций). The attachment is visible in the request; no local file identifier was supplied. It is a structural reference for the existing production app, rather than a request to introduce a dark theme or replace the design system.

Implementation evidence from Chromium/Playwright, with mocked API data and deviceScaleFactor 1:

- `/tmp/force-payment-browser/finance-panel-desktop.png` — right panel, 913 × 961 px, captured in a 1760 × 1080 CSS viewport.
- `/tmp/force-payment-browser/finance-page-desktop.png` — 1760 × 1080 px, full context including the unchanged left organization list.
- `/tmp/force-payment-browser/finance-panel-mobile.png` — 390 × 900 px viewport, panel header aligned below the fixed app navigation.
- `/tmp/force-payment-browser/finance-operation-list.png` — focused operation-list interaction capture.

State: selected Yura Luks organization, Finances tab, base-currency balance, minimum balance outside edit mode, mixed deposits/payments/sales/purchases. Transient success notifications were allowed to disappear before final capture. Source density is unspecified and its list is cropped; assessment concerns hierarchy, content density and working production behavior, not a claim of pixel-identical rendering.

## Comparison and findings

The reference and rendered captures were reviewed for the same selected-organization finances flow. The implementation follows the reference's hierarchy: organization header and transaction action, tabs, unified balance/minimum summary, then an operation history with compact filters and two-line rows. Focused inspection covered operation titles, signed amounts, dates, limit editing and document affordances. No actionable P0/P1/P2 finding remains.

- Typography: existing Inter/system font stack retained. Balance is the main 26 px figure; operation titles use 14 px semibold, signed amounts 15 px, supporting direction/date text 12/11 px. Mobile amounts wrap instead of causing horizontal overflow.
- Spacing/layout: separate balance/minimum cards and the transaction table were replaced with one summary and 66 px operation rows. Filters occupy one row on desktop and two compact rows on mobile. The left-list markup was compared against the previous commit and is unchanged.
- Colors/tokens: established light-theme surfaces and brand tokens retained. Credits use `#15803d` with a plus sign and an inward arrow; debits use the foreground color, minus sign and outward arrow. Reversed operations are muted and struck through, and pending operations remain labelled. Color alone does not convey direction.
- Assets: the reference contains interface icons, not raster artwork. Element Plus icons are reused for flow, navigation, filtering, editing and refresh. No substitute imagery, custom SVG, or CSS illustration was introduced.
- Copy/content: repeated “Перевод” was replaced with source titles such as “Ручной перевод”, “Продажа” and “Закупка”. Supporting text separates account impact (“Поступление” / “Списание”) from transfer direction. The selected organization is not repeated in every row. RU/EN/TR are implemented.

## QA iteration history

1. Initial rendered review found two P2 issues: duplicating a single RUB balance beside the same base-currency total, and a framework success token producing insufficiently dark green for small credit amounts. The single-base-currency duplicate was suppressed while preserving all multi-currency balances, and credit text was changed to `#15803d`. The final desktop/mobile captures above show these fixes.
2. Capture review found transient notifications covering the header and an element-level mobile capture positioned under fixed navigation. No production code change was needed: capture now waits for notifications to disappear and aligns the panel below navigation. Final evidence shows the organization header and transaction action unobscured.

## Intentional constraints

- Full-period receipt/debit totals require a backend aggregate. Partial totals from the first 20 loaded operations are not presented as period totals. The summary uses the complete financial profile and currency balances returned by the backend.
- Search and operation-type filtering from the illustrative wireframe are not simulated against a partial cursor list. Existing server-backed period/currency/reversed filters remain functional.
- The existing app's light theme, fonts and primary-button treatment are retained. No site-wide theme or left-list redesign is included.

## Verified interactions

- Minimum balance: open editor, cancel with Esc without sending a mutation, save, Enter-to-save, and collapse editor after success; permission checks remain enforced.
- Create transaction: exact amount and forcePayment retained, then financial summary and history refresh.
- Source navigation to sale/purchase documents, permissions and reversed-operation guards.
- Infinite cursor loading, end-of-list stop, append failure/retry retaining existing rows, filter reset and stale-response protection.
- Backend account convention: sender balance increases and receiver balance decreases, covered by dedicated tests; signed display follows that convention.
- Base-only balance deduplication, multi-currency detail with a separate base-currency total, RU/EN/TR, desktop/mobile containment and browser console errors (none in the tested scenarios).

Validation: `npm run check` passed, including 255 tests, lint, types and production build. Browser mutations were mocked; no live financial data was changed. Screenshot paths are local session artifacts, not hosted URLs.

## Follow-up

Backend aggregates can enable full-period receipt/debit metrics later. No remaining visual P3 polish is required for this iteration.
