# Bukks V2 — Role Shells, Four-Tab Architecture & Account Recovery

A staged refactor. Existing backend, data model, cart, orders, payments and vendor infrastructure stay exactly as they are — only the experience layer is reorganised around them.

## Phase 1 — Authentication & Account Recovery (foundation)

Complete auth surface for all roles (Student, Seller, Farmer, Rider):

- `/forgot-password` — one field (email), always shows the neutral response: "If an account matches these details, recovery instructions have been sent."
- `/reset-password` — public route, reads the recovery session from the URL, handles expired/invalid/used links with a clear retry path, enforces password confirmation and strength rules.
- Post-reset: confirmation screen, sign out of other sessions, audit entry written to the existing event log, then return to login.
- Signed-in: **You → Security → Change password** (re-authenticate with current password, then update).
- "Forgot password?" link added to the login screen.

Reset tokens are issued and validated by the backend auth service — single-use, expiring, and invalidated once a reset succeeds. Leaked-password protection stays enabled.

## Phase 2 — Role Routing & Role Shells

One shell component, four tab configurations. Role is resolved immediately after authentication and the user is routed into their own shell; a seller never lands on the student marketplace, and no role sees controls it lacks permission for.

```text
Student   Home        Explore      Orders      You
Seller    Dashboard   Orders       Products    Business
Farmer    Dashboard   Produce      Requests    Farm
Rider     Dashboard   Deliveries   Earnings    You
```

- Floating dock, ~70px, four destinations, no hamburger, no duplicated top navigation.
- Selected tab: white icon + label, soft violet glow, 2px indicator, slight lift.
- Routes become `/app/:tab` per role, with permission guards on every destination.
- Existing dashboard content is redistributed under the four destinations rather than rebuilt.

## Phase 3 — Bukks Design Language

Applied as tokens and shared primitives so the whole app inherits it.

- Five surface types: canvas, editorial, image, feature, utility. Not everything gets a border, background or rounded corner.
- Colour: canvas `#060713`, elevated `#0C1020`, utility `#13182A`, violet `#725CFF` / `#8C7AFF`, cyan `#22D3EE` accent, mint `#2EE6A6` for success/available, text `#F7F8FC` / `#A8AEC0` / `#6F768B`.
- Type: Sora display, Inter UI, with the stated size/weight ladder and sparing uppercase micro-labels.
- **Booking Line** — the signature component: a thin luminous path used for order status, group-buy participants, and supply chain, animating between states. Also used as the loading indicator instead of a spinner.
- Image system: fixed ratios (vendor hero 16:9, product grid 4:3, discovery 3:4, avatar 1:1) with a consistent dark-gradient treatment.
- Per-type skeletons (vendor, product, order, pulse) and branded empty states.

## Phase 4 — Student Experience

- **Bukks Command Deck** — one asymmetric surface with four zones (Eat, Shop, Together, Discover), Eat carrying the most visual weight. Replaces the four identical quick-action cards.
- **Bukks Pulse** — contextual recommendation surface driven by time of day, distance, availability, promotions, repeat orders and campus location, with a headline + reason + a single offer.
- Home: greeting, delivery location, command deck, Pulse, active order, near you, trending, reorder.
- Explore: search, editorial category rails (Food / Market / Campus), map-and-cards hybrid with full-screen map on tap.
- Orders: active / scheduled / group / history, with the Booking Line as the hero and the item list secondary; live rider card after assignment.
- You: identity row, three stats, then Your Bukks / Preferences / Support groups. Logout quiet at the bottom, delete account nested under Account.
- Card formats differentiate by context: discovery, compact, trending overlay, vendor hero.

## Phase 5 — Seller, Farmer, Rider Experiences

Each gets its own four destinations using the same design language:

- Seller: store health and sales dashboard, order queue, product/inventory management, business settings, promotions, customer messaging.
- Farmer: produce listings, harvest quantity and availability management, incoming buyer/vendor requests, fulfilment and earnings.
- Rider: assignment feed, navigation to pickup and drop-off, status updates, earnings and delivery history.

## Technical notes

- No schema changes are required for Phases 1–4. Farmer requests and seller promotions in Phase 5 may need new tables; those will be raised as separate migrations at that point.
- The router moves to nested role shells; `ProtectedRoute` is extended into a permission-aware guard using the existing roles hook.
- Recovery events are recorded through the existing event log table.
- Work is built one phase per turn so each phase stays reviewable.

## Suggested start

Phase 1 and Phase 2 in the first pass — recovery is a security gap today, and the role shell unblocks every screen after it.
