# Saanjh

A concept site for a modern Indian restaurant. Saanjh means dusk, the hour
the fires are lit. Astro 7 + Tailwind 4. The section structure began as a
study of qissa.co.uk; the name, logo, copy, night sky and booking flow are
original, and the imagery is placeholder so this can be re-skinned per client.

    npm install
    npm run dev

## Where things live

- `src/data/site.ts`   every string and image on the page. Change this first.
- `src/styles/global.css`  design tokens (@theme) + the motion primitives.
- `src/scripts/motion.js`  IntersectionObserver reveals, tilt, counters.
- `src/scripts/sky.js`     the night sky behind the page (see below).
- `src/components/`    one component per section, in page order.
- `public/favicon.svg`     a bolder cut of the mark on a navy tile, for small
  sizes. `Logo.astro` holds the full mark inline, with lockup, stacked and
  mark-only variants. The Room section draws the same mark large.

## The night sky

`Sky.astro` fixes two canvases behind everything. `sky.js` pre-renders three
star layers (far, mid, near) and a faint Milky Way into viewport-sized tiles,
then slides each tile at its own share of the scroll position, so the page
feels like panning across a deep sky. Only the ~100 twinkling stars and the
occasional shooting star repaint every frame. Tune densities and speeds in
the `LAYERS` table at the top of the file. Reduced motion gets one static
paint.

## Reservations

`Reserve.astro` is a two-step booking flow: venue, party size, a calendar
that respects each venue's opening days and the booking window, time slots,
then contact details and a confirmation with an add-to-calendar file.
Opening days and sittings live on each venue in `site.ts`
(`locations.venues[].booking`).

Availability is simulated (`slotsFor()`): deterministic per venue, date, time
and party size, busier at weekend prime time. Replace that one function with
a call to a real availability API when there is one.

Requests are emailed through Web3Forms. Put an access key in `.env`:

    PUBLIC_WEB3FORMS_KEY=your-key

Without a key the flow still works end to end and the confirmation says it
is a demo, so nothing is silently lost.

## Motion

No animation library. `.reveal` + `.reveal.in` does ~90% of it.
Add `d1`..`d4` to siblings for stagger. Everything respects
prefers-reduced-motion.

## Images

Remote Unsplash URLs, optimised at build by astro:assets (sharp).
Swap the slugs in `site.ts` for real photography before this ships anywhere.

## Offline / restricted networks

`npm run build` fetches and optimises every Unsplash image. If that network
call is blocked:

    PUBLIC_RAW_IMAGES=1 npm run build

That swaps `src/components/Img.astro` to plain `<img>` tags. Never ship with
it set: you lose WebP conversion and correct sizing.
