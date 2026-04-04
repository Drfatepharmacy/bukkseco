

# Plan: Seed Map Data & Test Live Tracking

## What We're Doing
Insert sample data into three tables so the live tracking map has landmarks, members, and a rider position to display, then navigate to `/live-tracking` to verify it works.

## Data to Insert

### 1. Landmarks (10 entries around Lagos/University of Lagos area)
Campus-relevant landmarks: Main Gate, Library, Faculty of Science, Sports Center, Chapel, Clinic, SUB Building, Lagoon Front, New Hall, DLI Building — all with realistic coordinates around UNILAG (6.515–6.525, 3.385–3.400).

### 2. Registered Members (8 entries)
Sample students/vendors with names, emails, phone numbers, addresses, and coordinates scattered around the campus area. All set to `active` status.

### 3. Rider Location (1 entry)
One active rider position near the campus center so the rider marker appears and the map can calculate directions to members.

## Technical Steps

1. **Insert landmarks** — 10 rows into `landmarks` table with name, lat/lng, type (gate, library, clinic, etc.)
2. **Insert registered members** — 8 rows into `registered_members` with contact info and coordinates
3. **Insert rider location** — 1 row into `rider_locations` with `is_available = true`
4. **Navigate to `/live-tracking`** — verify dark map loads, sidebar shows members, landmarks appear, rider marker pulses

## No Code Changes Needed
This is purely a data seeding task. The LiveRiderTracking component already queries these tables.

