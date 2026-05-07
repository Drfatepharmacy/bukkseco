
## 1. Sidebar layout fix (background ratio preserved)

Issue: When sidebar is open on mobile, the backdrop covers the page; when collapsed on desktop the main content's left margin doesn't match the actual sidebar width, breaking the layout ratio.

Fix in `DashboardSidebar.tsx` and `DashboardPage.tsx`:
- On mobile (<768px) the sidebar overlays without shifting `<main>` (margin stays `ml-0`); collapsing slides it fully off-screen so the main content fills 100% width — no leftover gutter.
- On desktop (≥768px) the sidebar is always visible at either `w-20` (collapsed) or `w-64` (expanded). The main `<main>` margin tracks exactly: `md:ml-20` collapsed / `md:ml-64` expanded. No backdrop on desktop.
- Keep the click-outside auto-collapse behavior on mobile only.

## 2. Multi-step onboarding wizards

Refactor `src/pages/SignupPage.tsx` into a stepper (using a small local `step` state, no new dependency). Steps per role:

```text
Student (3 steps)  : Account → Contact/Location → Review & Submit
Vendor  (4 steps)  : Account → Business Info → Kitchen Photos + Docs → Pending-Approval screen
Farmer  (4 steps)  : Account → Farm Info → Produce/Photos → Pending-Approval screen
Rider   (4 steps)  : Account → Vehicle → License + Profile Photo → Pending-Approval screen
Admin            : not self-serve (kept disabled — created via founder console)
```

New components:
- `src/components/signup/StepShell.tsx` — wizard chrome (progress bar, Back/Next, geomorphic styling matching the restored UI).
- `src/components/signup/FileUploadField.tsx` — drag/drop + preview, uploads to the right bucket via `supabase.storage`.
- `src/components/signup/PendingApprovalScreen.tsx` — final screen for vendor/farmer/rider with status check and "Go to login".

Uploads (use existing buckets):
- vendor kitchen photos → `food-images/vendors/{userId}/kitchen-{n}.jpg` (public, fine for marketing).
- rider license + farmer farm photos → new private bucket `verification-docs` (only owner + admin can read).

Persist new fields:
- `vendor_profiles.kitchen_photos[]` (already exists) populated post-upload.
- `rider_profiles.license_url` populated post-upload.
- `farmer_profiles` add nullable `farm_photos text[]` and `farm_size_hectares numeric` (small migration).

Validation: zod schema per step. Block "Next" until current step valid. Show toast on auth/storage failure and roll back partial inserts when possible.

## 3. Founder console for ilomuche@gmail.com

Currently `/founder-console` requires `role === 'admin'` AND a passphrase. Make `ilomuche@gmail.com` a permanent founder:
- Migration: insert `admin` row in `user_roles` for that user (looked up via `auth.users.email`) if missing.
- Update `FounderConsolePage.tsx` to bypass the passphrase prompt when `user.email === 'ilomuche@gmail.com'` and auto-`setAuthenticated(true)` on mount.
- Update `ProtectedRoute` check: also allow founder email through the `allowedRoles=["admin"]` gate even if their role row is still propagating.

## 4. Supabase security linter fixes

From `supabase--linter` results:

- **Function Search Path Mutable (1 fn)**: `prevent_wallet_tx_mutation` is missing `SET search_path`. Recreate with `SET search_path = public`.
- **Public Bucket Allows Listing (food-images, avatars)**: Replace the broad public `SELECT` policy on `storage.objects` for these buckets with two narrower policies:
  - `SELECT` allowed only when the request targets a single object name (no prefix listing). Implementation: drop the existing wide policy and add `CREATE POLICY ... FOR SELECT USING (bucket_id IN ('food-images','avatars') AND auth.role() IS NOT NULL OR true)` is still listing-capable — instead split: keep public read on individual objects via signed/public URLs only and **revoke** the listing policy. Concretely: drop existing "Public read" policies on these buckets and add policy `... USING (bucket_id IN ('food-images','avatars') AND name IS NOT NULL)` combined with revoking `LIST` access by removing the policy that matches `bucket_id = 'x'` without name filter. (Practical Supabase pattern: keep buckets public for direct URL fetches but remove the policy that allows listing — done by ensuring no `SELECT` policy returns rows for arbitrary prefixes.)
- **Public Can Execute SECURITY DEFINER Function (multiple)**: For each definer function not meant to be called by anon (`update_meal_rating`, `handle_new_user`, `prevent_wallet_tx_mutation`, `create_wallet_for_profile`, `generate_rider_display_id`, `generate_ticket_number`, `generate_order_number`, `decrement_meal_stock`, `increment_group_participants`, `mark_messages_as_read`, `settle_order_payment`):
  - `REVOKE EXECUTE ... FROM PUBLIC, anon`.
  - `GRANT EXECUTE ... TO authenticated, service_role` only where end-users actually call them (`mark_messages_as_read`, `settle_order_payment`); the rest are trigger-only — leave with no grant.
- Re-run linter after migration; address any remaining warnings.

## 5. Verification

- Re-run `supabase--linter` and confirm warnings cleared (or documented).
- Manually walk through each role's signup wizard in preview, confirming uploads land in correct buckets and the post-signup landing screen behaves.
- Toggle sidebar on mobile + desktop and confirm main content width matches available space (no gutter, no overlap).
- Log in as `ilomuche@gmail.com` and confirm `/founder-console` opens without passphrase.

## Technical notes

- All schema changes go through a single `supabase--migration` call (new column + role grants + storage policy changes + founder role insert).
- No new npm packages required (zod, framer-motion already present).
- Storage policy edits use `storage.objects` (allowed) — no changes to `storage.buckets` schema.
