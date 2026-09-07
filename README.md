# Multi-Location Booking Page

A GitHub Pages + Supabase booking template designed for multiple locations/instructors.

## Current features

- One reusable booking page for multiple locations.
- Location/instructor configuration stored in Supabase.
- Custom 3-color branding:
  - Primary: #FFFFFF
  - Secondary: #000000
  - Accent: #FF0000
- Per-location logo.
- Recurring availability rules.
- Special-day table ready for overrides/closures.
- Configurable student capacity per time slot.
- One student per booking.
- One booking can contain multiple consecutive slots.
- Gaps are not allowed.
- Existing student bookings consume one capacity seat per slot.
- Non-booking Google Calendar events block the affected slots.
- Booking events created by this system do not block the whole slot.
- 2-week booking horizon.
- Configurable minimum booking notice (default 24 hours).
- Configurable cancellation window (default 24 hours).
- Configurable reschedule window (default 12 hours).
- One Google Calendar event for the complete contiguous booking.
- Database records each individual occupied slot for capacity accounting.
- Payment flag and Stripe fields are included for the future.

## GitHub Pages

Upload:

- index.html
- config.js
- styles.css
- app.js
- assets/safe-insight-logo.png

Edit `config.js` with your Supabase project URL, anon key, and Edge Functions URL.

Example:

`https://YOUR-USERNAME.github.io/YOUR-REPO/booking/?location=phoenix`

## Supabase

1. Run `supabase-schema.sql`.
2. Deploy the Edge Functions.
3. Set these Edge Function secrets:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - SUPABASE_SERVICE_ROLE_KEY
   - PUBLIC_BOOKING_URL
4. Connect each location's Google Calendar and store its refresh token in
   `google_calendar_connections`.

## Google Calendar behavior

The system distinguishes:

### Blocking events
Any Google Calendar event that does NOT contain:

`extendedProperties.private.booking_id`

is considered a blocking event.

### Booking events
Events created by this system contain:

`extendedProperties.private.booking_id`

and therefore do not make the whole slot unavailable. Their capacity is represented by `booking_slots`.

## Important production work before launch

The included code is a foundation, not a production launch package. Before accepting real bookings:

- Add a proper Google OAuth admin connection screen.
- Add transactional/atomic capacity reservation in Postgres so simultaneous
  bookings cannot race.
- Add a real email provider / Edge Function for confirmation emails.
- Add manage-booking.html and secure token-based cancel/reschedule endpoints.
- Implement Google event update/delete for rescheduling/cancellation.
- Implement Stripe Checkout + webhook before setting `payment_required=true`.
- Store Google refresh tokens in a properly protected secret/vault strategy.
- Add admin authentication and a location management interface.
- Add DST-safe timezone handling for every location.
- Add rate limiting / bot protection.
- Test Google recurring events, all-day events, DST transitions, cancellation,
  rescheduling, and simultaneous booking attempts.

The architecture intentionally keeps Google secrets, Stripe secrets, and the
Supabase service-role key off GitHub Pages.
