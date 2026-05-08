## Plan

### 1. Enable Leaked Password Protection
- Call `supabase--configure_auth` with `password_hibp_enabled: true` (keeping current values for the other flags: `disable_signup: false`, `external_anonymous_users_enabled: false`, `auto_confirm_email: false`).
- Re-run `supabase--linter` to confirm the "Leaked Password Protection Disabled" warning is gone.

### 2. Sidebar — let background scale instead of being covered
Currently on mobile, when the sidebar is **expanded** (`w-64`), it sits `fixed` over the page with a black backdrop, so the background content is hidden, not resized. The user wants the background to "fit in properly to scale" — i.e. when the sidebar opens, the main content should shrink/reflow next to it rather than being overlaid.

Changes in `src/components/DashboardSidebar.tsx`:
- Remove the mobile backdrop (`bg-black/50`) entirely.
- Remove the `-translate-x-full` collapse-off-screen behavior. The sidebar stays in flow at `w-20` (collapsed) or `w-64` (expanded) on **all** breakpoints.
- Drop the click-outside auto-collapse listener (no longer needed since nothing is overlaid).

Changes in `src/pages/DashboardPage.tsx`:
- Apply the margin offset (`ml-20` / `ml-64`) at **all** breakpoints, not just `md:`, so the main content always reflows next to the sidebar.
- Default `collapsed=true` on small viewports so the sidebar starts as a narrow icon strip (background gets ~`calc(100% - 5rem)` instead of being hidden).
- Keep the toggle button to expand/collapse.

Result: the sidebar behaves like a true push sidebar — collapsing it makes the main area wider, expanding it makes the main area narrower; nothing is ever hidden under an overlay.

### 3. Verification
- Re-check `supabase--linter` (HIBP warning resolved).
- Visually confirm in preview at mobile (563px) and desktop widths that toggling the sidebar reflows main content rather than overlaying it.
