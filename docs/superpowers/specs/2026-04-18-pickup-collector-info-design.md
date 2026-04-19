# Pickup Collector Information Design Spec

## Overview
When staff clicks "PICK UP" on the pickup page, a confirmation modal appears pre-filled with the customer's name and phone. Staff can confirm or edit before completing the pickup action.

## UI/UX

### Trigger
Staff clicks "PICK UP" button on a ticket

### Modal Content
- **Header:** "Confirm Pickup" with package icon
- **Body:** Two text fields:
  - "Collected By" (name) - pre-filled with customer name, editable
  - "Phone Number" - pre-filled with customer phone, editable
- **Footer:** "Confirm Pickup" (primary emerald button) and "Cancel" (secondary gray button)

### Visual Style
- Dark backdrop (`bg-black/50`) with centered modal
- `card-bevel` styling matching the app's design system
- Green/emerald accent for confirm button (matching the PICK UP action)
- Pre-filled fields shown in standard input styling

## Data Flow

1. Staff clicks PICK UP
2. Modal opens with customer name/phone pre-filled
3. Staff confirms (or edits) and submits
4. Frontend sends: `PATCH /api/operations/:id/workflow-status` with:
   ```json
   {
     "workflow_status": "delivered",
     "picked_up_at": "<ISO timestamp>",
     "picked_up_by_name": "<name>",
     "picked_up_by_phone": "<phone>"
   }
   ```
5. Backend updates operation record
6. Frontend refreshes and shows ticket as picked up

## Backend Changes

### Database Schema
Add to `operations` table:
- `picked_up_by_name` VARCHAR(255) - nullable
- `picked_up_by_phone` VARCHAR(50) - nullable

### API Endpoint
`PATCH /api/operations/:id/workflow-status` - update to accept and store `picked_up_by_name` and `picked_up_by_phone`

## Picked Items Page Updates

The "Picked Items" page (`/picked-items`) should display:
- Collector name
- Collector phone
- Pickup date/time (already exists as `picked_up_at`)

## Implementation Tasks

1. Add database columns to operations table
2. Update backend workflow-status PATCH endpoint to accept new fields
3. Create CollectorInfoModal component
4. Integrate modal into PickupPage - trigger on PICK button click
5. Update PickedItemsPage to display collector info
