# Sale price recommendation — design QA (2026-11-05)

final result: passed

## Scope and evidence

- Source: `/workspace/generated_images/exec-a8cd32dd-b88a-4433-9d31-a9d7009b9e62.png` (1672 × 941).
- Browser-rendered production components: `/workspace/shared/recommendation-qa/desktop.png`, `mobile.png`, `edit.png`.
- Desktop viewport: 1920 × 1080 CSS px, device scale factor 1; mobile: 390 × 844 CSS px, device scale factor 1.
- Full comparison: `/workspace/shared/recommendation-qa/comparison-full.jpg`. Source resized uniformly to the desktop viewport, adjacent to implementation. Browser chrome/background differs because the isolated harness mounts the actual sale dialogs rather than the application shell. Those unchanged regions are outside this feature's scope.
- Focused comparison: `/workspace/shared/recommendation-qa/comparison-panel.jpg`. Source sidebar normalized from 349 × 770 to 400 × 884, adjacent to the actual 400 × 884 sidebar.
- State: selected product 202.336-01, warehouse ОСНОВНОЙ, RUB, quantity 1, unapplied recommendation 4 650 ₽, sale price 0. History fixture repeats representative rows; chronology differences are fixture data, not sorting behavior.

## Findings and comparison history

No actionable P0/P1/P2 visual finding remains in the feature scope. Full-view and focused comparisons were opened and reviewed together. The compact recommendation stays above history, with price, unit, quantity/total, explicit apply action and a quiet explanatory line. History retains its filters, dense rows and its own scrolling region. Mobile keeps the entire recommendation and action inside the panel bounds.

- Typography: existing application fonts retained; 24 px recommendation price, 12 px supporting text, and native small Element Plus button. Generated mock typography is approximate; existing production sizes are intentionally preserved for surrounding history.
- Spacing/layout: existing 400 px sidebar, 16 px outer insets, 12 px block padding. The recommendation occupies about 140 px. Existing main sale form is not redesigned.
- Colors/tokens: application primary/soft-primary/text/border tokens retained, so user appearance settings continue to apply. The mock's pale green recommendation and stronger price hierarchy are preserved.
- Assets: no raster art is introduced by this feature. Existing Element Plus icons remain unchanged.
- Copy: recommendation heading, unit, quantity/total, explanatory line, loading/error/shortage states and apply action are localized in RU/EN/TR. The recommendation is distinct from historical sale prices.

## Interaction verification

Chromium used the actual create/edit sale dialogs with deterministic local GraphQL responses; it did not create live sales. Verified explicit application in both dialogs, reset of an existing item discount, no automatic price overwrite, quantity debounce, currency recalculation with late-response protection, insufficient-offer state without an apply action, retry after a failed calculation, history remaining usable during a pricing error, no recalculation when toggling historical crosses, permission-based hiding, and mobile bounds. Browser page errors: zero in the final run.

`npm run check` passed: lint, TypeScript, 41 files / 275 tests, production build. Unit tests cover request inputs, nullable prices, no detailed-offer field selection, debounce, stale responses, close/disposal cancellation and retry.

The live gateway did not yet publish recommendedPrice during verification. Runtime behavior was checked against backend PR #134 at abc3a8c using local responses; live integration must be validated after deployment. This is a deployment dependency, not a claim of verified live pricing.

## Follow-up polish

No blocking visual changes. Detailed offer breakdown is intentionally outside the selected mock and is not requested with standard pricing permissions.

---

# Organization finances — previous design QA

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

Validation: latest `npm run check` passed, including 257 tests, lint, types and production build. Browser mutations were mocked; no live financial data was changed. Screenshot paths are local session artifacts, not hosted URLs.

## Follow-up

Backend aggregates can enable full-period receipt/debit metrics later. No remaining visual P3 polish is required for this iteration.

## Transaction journal and drawer — follow-up QA

Source visual truth: the two inline user wireframes for the general transaction journal and grouped transaction details in the subsequent request. These specify source-first rows, compact metadata, grouped parties, contextual amounts and cancellation in details. The existing light production theme is retained; the source's dark background is not introduced globally. The source table omits a sidebar but the written brief explicitly permits retaining the filters on the left.

Final browser evidence, deviceScaleFactor 1:

- `/tmp/force-payment-browser/transactions-desktop.png` — 1760 × 1080 px; two-party exact-direction filter, neutral amounts, compact metadata without totals and expanded-filter indicator.
- `/tmp/force-payment-browser/transaction-manual-details.png` — 400 × 1080 px drawer capture; manual operation with one selected organization, contextual amount, grouped parties/metadata and the only cancellation action.
- `/tmp/force-payment-browser/transaction-details.png` — 400 × 1080 px; document transaction with its document action and no manual cancellation.
- `/tmp/force-payment-browser/transaction-details-mobile.png` — 390 × 900 px drawer, tested with the collapsed mobile filter panel.
- `/tmp/force-payment-browser/transaction-reversal-confirmation.png` — 420 × 248 px confirmation, showing the reverse route, amount and original-operation status change.

The wireframes and the captures were reviewed for hierarchy and interaction scope, with focused inspection of amount/state grouping, party direction, record density and cancellation. Drawer captures use the full runtime viewport; the supplied drawer reference is shorter/cropped. The records occupy the top part of the drawer rather than adding artificial information to fill a taller viewport. Captures wait for the opening animation to finish.

Fidelity surfaces:

- Typography: existing font stack; 26 px journal heading, 17 px drawer heading, 30 px amount, compact source titles and muted secondary type/date. The primary operation is its source, rather than two equally weighted badges.
- Layout: compact loaded-count/period/context metadata replaces three large summary boxes. Desktop keeps sender/receiver columns; observed table width controls the combined “From → To” column. The drawer groups amount/status/date, a vertical sender/receiver route, then source/currency/type and actions.
- Tokens/contrast: amounts remain neutral without one unambiguous organization. With a context, transfer outflow is red/minus and inflow green/plus. These are transfer-direction signs, intentionally distinct from the backend account-balance convention used in the organization finances panel. The tooltip states the journal meaning. Cancelled amounts are muted; pending state is visible. Destructive confirmation uses a red action, not the site's default green primary button.
- Assets: Element Plus icons for transfer, parties, direction, refresh, close and cancellation. No raster or invented illustration is required by these wireframes.
- Copy: “Loaded” describes the number of fetched records. No turnover or totals block is displayed. Pending/reversed operations remain explicitly identified. Cancellation describes a reverse movement and marks the original operation cancelled; it does not promise a new transaction record the backend does not create.

Iteration history:

1. Initial review found hidden active advanced-filter state, unlabelled pending rows, and excessive row line-height. A filter count/active treatment, pending label and compact line-height were added. Final desktop evidence shows these fixes.
2. The framework's primary-button styling overrode the initial destructive confirmation class. A dedicated scoped action class now makes the confirm button red. Semantic tag colors were darkened and the drawer cancel action uses an explicit danger color. Final confirmation/detail captures were reviewed after these changes.
3. An early screenshot caught the drawer opening transition and was unsuitable for comparison. Capture timing was fixed; final evidence above shows settled content.

Verified in the full-page browser flow: neutral two-party context and signed single-party context, absence of the turnover block, hidden/default and active advanced filters, source navigation affordances, infinite cursor loading without a load button, scroll-burst guards, append-error pause and explicit retry preserving rows/cursor, end-of-list request stop, arrow selection/Enter/Esc, pending/document reversal restrictions, cancellation dismissal without mutation, confirmation with exactly one reverse mutation and the correct transaction id/force flag, responsive party columns, collapsed mobile filters, drawer overflow and RU/EN/TR. No browser console errors occurred in these scenarios.

Backend constraints retained: at least one organization is required to request a list. General text/source filters and full-period aggregates require contract additions, so no fake controls or cross-currency grand total are shown. Both journals now load subsequent cursor batches automatically near the scroll boundary. The general journal has no load-more button; an error state offers an explicit retry to avoid repeated failing requests.

final result: passed
