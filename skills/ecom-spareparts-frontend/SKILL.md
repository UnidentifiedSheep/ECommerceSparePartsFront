---
name: ecom-spareparts-frontend
description: Use when working on the ecom-spareparts Vue frontend project, especially pages, dialogs, selectors, permissions, product, purchase, storage, user, producer, currency, and UI/UX changes that must stay aligned with the existing backend contracts and project conventions.
---

# Ecom Spareparts Frontend

Use this skill for frontend work in the `ecom-spareparts` repository.

## Core Rules

- Inspect the existing frontend patterns before changing code.
- Backend files under `backend/` may be read to check contracts, endpoints, permissions, and DTOs, but must not be edited unless the user explicitly asks for backend changes.
- Prefer existing components, selectors, models, services, composables, and utilities over creating duplicate logic.
- Keep view files focused on page orchestration. Move reusable dialogs, details panels, tables, and editors into `src/components/<domain>/`.
- Use `apply_patch` for manual edits.
- Run `npm run build` after frontend changes unless the user asks not to.

## Permissions

- Check frontend permissions before showing create, edit, delete, and upload actions.
- Use `usePermissions()` and the user permissions from auth/store instead of relying on API failures.
- Match permission names to backend endpoint requirements. Backend permission constants often use dot notation, while frontend checks may use normalized underscore notation depending on the existing composable behavior.
- Hide unavailable actions when the user cannot perform them. Disable only when the action should remain visible for context.

## Backend Contracts

- Read endpoint files in `backend/src/Services/Main/Main.Api/EndPoints/` when a request or response contract is unclear.
- Keep request models in `src/services/api/*.ts` close to backend DTO names and shape.
- When backend returns a created or updated entity, update frontend state from the response instead of re-fetching unless the endpoint requires a refresh.
- If a backend contract changed, update frontend service functions first, then the consuming components.

## UI And UX

- Keep operational pages compact, readable, and task-oriented.
- Avoid oversized decorative layouts for admin/workflow screens.
- Use dialogs for create/edit flows that stay in the context of an existing page.
- If a dialog grows complex, split it into a dedicated component and emit events such as `created`, `updated`, or `saved`.
- Start create dialogs with zero dynamic rows when users are expected to explicitly add rows.
- Localize all user-facing text through the project i18n layer; do not hardcode UI strings in views or components.
- Do not show raw IDs unless they are useful for the workflow.
- Pagination should be left-aligned.

## Localization

- The frontend supports `ru`, `en`, and `tr`. Every new user-facing label, placeholder, empty state, notification, confirmation, validation message, and table/action label must have translations for all three languages.
- Use `src/i18n/index.ts`, `useI18n()`, and `t(...)` for UI text. Do not put Russian, English, or Turkish literals directly into Vue templates, scripts, services, enums, or utilities unless they are backend/system constants or user data.
- Keep localized enum/status labels in i18n or existing enum-label helpers. Backend enum values should remain stable constants in requests, responses, and comparisons.
- Date, number, and money formatting should follow the active locale from `useI18n().locale`; avoid hardcoded `ru-RU` in new code unless formatting a backend/system invariant explicitly requires it.
- API requests must send the current language to the backend via `Accept-Language`; preserve the existing interceptor/realtime patterns when adding new API clients or SignalR connections.
- Backend validation errors are already localized. When handling `ApiError`, show `error.message`; it prioritizes `validationErrors[].errorMessage` over technical `detail`.
- Do not show API paths, endpoint names, or backend technical details in UI copy. Replace them with task-focused descriptions.
- After localization work, scan changed frontend files for accidental Cyrillic or hardcoded visible strings outside `src/i18n/index.ts`, then run `npm run build`.

## Selectors

- Reuse existing selectors from `src/components/selectors/`.
- If the same selector logic appears in multiple places, move it into a shared selector component rather than duplicating `el-select` and API calls.
- Product selection should use `ProductSelectorDialog` unless the workflow clearly needs inline selection.
- User selection should use `UserSelector`; pass roles when filtering suppliers or other role-based groups.

## Products

- Product indicator means color. Display it as a color swatch, not as raw indicator text.
- Product units should be displayed through localized measurement utilities with correct plural forms where applicable.
- Product images should support browsing multiple images, selecting thumbnails, zooming, adding, and deleting when permissions allow.
- Product storage content should not show zero positions by default unless the user asks to include them.

## Purchases

- Purchase creation belongs in a component such as `src/components/purchases/CreatePurchaseDialog.vue`, not inline inside `PurchasesView.vue`.
- Purchase views should keep the page responsible for filters, list loading, selection, and refresh; details and create/edit dialogs should be separate components.
- Supplier selectors for purchases should filter by the supplier role.
- After creating, editing, or deleting purchase-related data, refresh the visible purchase list or details when totals or counts can change.

## Formatting And Dates

- All date-time values sent to backend APIs must be UTC. Use existing date utilities such as `toUtcDateTimeString` when converting user-selected local date-time values before requests.
- Display dates and times in the user's local timezone using existing date utilities.
- Use the active i18n locale or existing formatting utilities for user-facing numbers and money.
- Keep currency signs from backend currency models.

## Verification

- Run `npm run build` for type-check and production build after code edits.
- If build fails, fix type errors before finishing.
- Mention any remaining warning that is not caused by the change, such as Vite chunk-size warnings.
