# Anthesis: App Store Connect kit

Everything to paste into App Store Connect, plus what still needs doing on your side.

## Before you start

1. Host the `site` folder somewhere with HTTPS. Netlify or GitHub Pages take the folder as it is. Three URLs come out of it:
   - Marketing URL: `https://yourdomain/`
   - Support URL: `https://yourdomain/support.html`
   - Privacy Policy URL: `https://yourdomain/privacy.html`
2. Replace the two `href="#appstore"` App Store links in `index.html` with the real App Store link once the app has an ID (App Store Connect shows it under App Information).
3. The support and privacy pages use vvmoore213@gmail.com. Change it if you want a separate address.
4. In Xcode, set the Bundle ID (for example `com.jonathanmoore.anthesis`), version 1.0, build 1, and check the Team is set. Upload a build with Product, Archive, then Distribute App.

## App Information

- Name: Anthesis
- Subtitle (30 max): Bloom through the urge (22)
- Primary category: Games, subcategory Puzzle
- Secondary category: Health & Fitness
- Content rights: does not contain third-party content (the flower art and music were made for the app)
- Age rating: answer None to every content question except "Medical/Treatment Information: Infrequent/Mild". That gives 12+. If you prefer 4+, answer None there too, since the app gives no medical advice; the privacy page says 12+, so change that line to match whatever you pick.

## Pricing

The app is free. One non-consumable in-app purchase, "Full bloom".

Create it under Monetisation, In-App Purchases, before you submit the version, and tick it on the version page so it is reviewed with the build:
- Type: Non-Consumable
- Reference name: Full bloom
- Product ID: `com.vvmoore.anthesis.fullbloom` (must match exactly; it is in Purchases.swift and Products.storekit)
- Price: tier of your choice; the test file uses $4.99
- Display name: Full bloom
- Description: The garden and every puzzle pond, for good.
- Review screenshot: a screenshot of the paywall screen in the app (required)
- Family Sharing: on

To test before submitting: in Xcode, Product, Scheme, Edit Scheme, Run, Options, set StoreKit Configuration to Products.storekit. Purchases then succeed on the simulator without charging anything. Turn it back to None before archiving.

## Version Information

Promotional text (170 max, can be changed without a new build):

> A pond of flower buds, two thumbs, and the ten minutes an urge takes to pass. New: forty puzzle ponds.

Description (4000 max):

> Where two ripples cross, a bud blooms.
>
> Anthesis is a game for the worst ten minutes. Tap the water and a ring spreads across the pond. One ring only makes a bud stir. Tap from the other side at the same moment and the two rings meet on it: it opens, bursts into petals, and sends out a bright ring of its own that opens every bud nearby. Clusters go off like dominoes, the chain count climbs, and every tap plays a note in key with the music.
>
> It was made for riding out urges. Before a round you rate how strong the urge is, from one to ten. After, you rate it again. Over time the app shows how much it drops while you play, in your own numbers. It works for whatever you are trying to leave behind, and it never asks what that is.
>
> A GARDEN THAT GROWS
> Set your start date and every clean day plants a flower. New kinds arrive at milestones: poppies at three days, water lilies at two weeks, dandelions at a month, moonflowers at a year. If you slip, the count starts again from today. Nothing in your garden is taken away.
>
> FORTY PUZZLE PONDS
> Each pond is a fixed arrangement of buds and a handful of ripples to clear it with. Find where two rings would cross on the right bud, and where its bloom would reach, and the whole pond goes in one move. Three blossoms for clearing it at par. Every three ponds brings a new flower.
>
> FIFTEEN FLOWERS
> Peony, poppy, anemone, water lily, dandelion, ranunculus, camellia, dahlia, clematis, lotus, passionflower, hellebore, magnolia, spider chrysanthemum and moonflower, each with its own bud, bloom and petals.
>
> NOTHING LEAVES YOUR PHONE
> No account, no ads, no analytics, no tracking. Your ratings, your clean days and your garden are stored on your phone and nowhere else. It works fully offline.
>
> Playing the pond, rating the urge and counting clean days are free. Full bloom, a single purchase, grows your days into the garden and opens all forty puzzle ponds.
>
> Anthesis is a distraction for a few hard minutes, not a treatment. If you are struggling, please reach out to someone.

Keywords (100 max, commas, no spaces):

> nofap,urge,craving,sober,streak,habit,relapse,quit,calm,puzzle,flowers,garden,ripple,zen,focus

(That is 94 characters. Don't repeat words from the name or subtitle; Apple indexes those already.)

What's New (for 1.0):

> First release.

Copyright: 2026 Jonathan Moore

## App Privacy

Choose "Data Not Collected". Every answer is No: the app has no account, no analytics SDK, no ads, no network calls. This matches the privacy page, and it must keep matching if you ever add analytics.

## App Review Information

- Sign-in required: No
- Contact: your name, phone and email
- Notes for the reviewer:

> Anthesis is a two-thumb game: a bud opens when two ripples reach it at the same moment from different sides. On the simulator, hold Option to place two touch points. The day counter and garden are opened from the start screen; Your streak lets you set a start date. The app makes no network calls and stores all data locally.

## Screenshots

Required sizes:
- 6.9 inch (iPhone 16 Pro Max): 1320 x 2868
- 6.5 inch (iPhone 11 Pro Max or XS Max): 1284 x 2778 or 1242 x 2688

iPad is only needed if the app supports iPad; set the project to iPhone only unless you want to test the layout there.

Take them on the simulator with Cmd+S, or on a phone and run them through a frame tool. A good set of six:
1. A big chain reaction mid-burst, petals flying.
2. The start screen with the days counter.
3. The garden with a few weeks of flowers.
4. A puzzle pond with the ripple dots.
5. The result screen: urge before and after.
6. The herbarium moment: a new flower arriving with its name.

Captions, if you add text to the frames:
1. Where two ripples cross, a bud blooms.
2. Rate the urge. Play. Rate it again.
3. Every clean day plants a flower.
4. Forty puzzle ponds.
5. Watch the number drop.
6. Fifteen flowers to discover.

## App preview video (optional)

Up to 30 seconds, same sizes as screenshots, captured with the device's screen recording. Fifteen seconds of chain reactions with the sound on is the whole pitch.

## Things reviewers tend to flag for an app like this

- Guideline 1.4.1 (physical harm): the app gives no medical advice and says it is not a treatment, in the app and on the support page. Keep it that way.
- Guideline 5.1.1 (data): "Data Not Collected" with a working privacy URL clears this.
- Guideline 4.2 (minimum functionality): not a concern; it is a full game.
- Guideline 3.1.1 (in-app purchase): the paywall says what is paid, has a Restore purchase button and a privacy link, and the free part of the app works without buying. Attach the IAP to the version or the reviewer cannot test it; if it is not attached, the build is rejected with a note about "missing in-app purchase".
- Crash on launch is the most common rejection. Install the archived build on a real phone through TestFlight first and play a full round, a puzzle, and the garden.
