LINDSELL CRICKET CLUB WEBSITE - CONTINUOUS UPDATE HISTORY
=========================================================

WEBSITE v1.3.1 - SPONSOR LOGOS
-------------------------------
- Added a dedicated local sponsor-logo folder:
  assets/images/sponsors/
- Added sponsor branding to all three sponsor cards.
- Town & Country Pests branding is taken from a branded image on the sponsor's own website.
- Dunmow Crematorium branding uses the business's published logo artwork.
- S J Wright Services' Wix site identifies its header artwork as smallFlogo.png,
  but a stable direct asset URL was not exposed through the available website fetch.
  A clean local wordmark fallback has therefore been included so the card is complete.
- Updated sponsors.html to load the local sponsor artwork.
- Added consistent sponsor-logo sizing and spacing to style.css.
- Added CSS cache version v1.3.1 to sponsors.html.

Files in this update:
- sponsors.html
- assets/css/style.css
- assets/images/sponsors/town-country-pests.jpg
- assets/images/sponsors/sj-wright-services.png
- assets/images/sponsors/dunmow-crematorium.jpg

WEBSITE v1.3.2 - CONTACT & FIND US POLISH
------------------------------------------
- Reworked Contact & Find Us into a clearer two-column layout.
- Retained embedded Google Map, directions, email, ground address and what3words.
- Added dedicated social cards and useful quick links.
- Added cache-busting version strings for v1.3.2.


WEBSITE v1.3.3 - BUILT-IN CONTACT FORM
---------------------------------------
- Added a built-in contact form to contact.html.
- Form submissions are sent through Formspree.
- Formspree endpoint:
  https://formspree.io/f/xgawpojv
- Added fields:
  Name (required)
  Email (required)
  Contact Number (optional)
  Message (required)
- Added responsive desktop/mobile layout.
- Added required-field indicators, focus styling and a Send Message button.
- Added email subject:
  "New message from the Lindsell CC website"
- Updated cache-busting version strings to v1.3.3.

No scoring-PC, live-scoreboard, Supabase, Play-Cricket API or GitHub Action
changes are required for Website v1.3.3.

WEBSITE v1.3.4 - HOME PAGE MOBILE POLISH
-----------------------------------------
- Completed the first page-by-page mobile review on the Home page only.
- Kept the desktop Home page layout unchanged.
- Reduced the mobile hero heading so "Even Better Company" stays together rather
  than leaving "Company" on a line by itself.
- Changed the three Home hero actions to three full-width mobile rows:
  Fixtures & Results, Live Score and Club Shop.
- Reworked Home section headings on mobile so the kicker is one line, the main
  heading follows on its own line, and the descriptive paragraph sits beneath.
- Applied this structure to Match Centre, Around the Club and Quick Links.
- Made the "More than just the score." heading responsive on phones.
- Reduced Home section spacing on mobile for a tighter layout.
- Increased the mobile menu button touch target to 44 x 44 px.
- Tightened the Home header logo/name spacing below 380 px to prevent narrow-screen
  crowding beside the menu button.
- Added Home-page scoping so these mobile changes do not alter other pages before
  their individual mobile reviews.
- Updated Home-page cache-busting query strings to v1.3.4.

Files in this update:
- index.html
- assets/css/style.css
- WEBSITE_UPDATE_README.txt


WEBSITE v1.3.5 - HOME PAGE MOBILE BUTTON & QUICK LINK POLISH
-------------------------------------------------------------
- Continued the Home page mobile review only.
- Changed the three hero actions on mobile so Fixtures & Results, Live Score and
  Club Shop remain on three individual rows but only grow wide enough for their
  text instead of stretching across most of the screen.
- Reduced the vertical padding of the four Home Quick Link cards on mobile so the
  cards are shorter without changing their width.
- Vertically centred the Quick Link text within each mobile card.
- Kept the desktop Home page layout unchanged.
- Updated Home-page cache-busting query strings to v1.3.5.

Files in this update:
- index.html
- assets/css/style.css
- WEBSITE_UPDATE_README.txt


WEBSITE v1.3.6 - HOME QUICK LINK VERTICAL ALIGNMENT
----------------------------------------------------
- Continued the Home page mobile review only.
- Tightened the four Quick Link cards further on mobile without changing their width.
- Gave each mobile Quick Link card a compact 58 px minimum height and reduced vertical
  padding so the title and supporting text sit visibly in the vertical centre of the box.
- Kept the desktop Home page layout unchanged.
- Updated Home-page cache-busting query strings to v1.3.6.

Files in this update:
- index.html
- assets/css/style.css
- WEBSITE_UPDATE_README.txt


WEBSITE v1.3.7 - HOME DESKTOP SECTION HEADER ALIGNMENT
--------------------------------------------------------
- Tidied the Home page desktop layout for the Match Centre and Quick Links headings.
- Moved the Match Centre explanatory paragraph beneath "Cricket at Lindsell" instead
  of positioning it to the right of the heading.
- Moved the Quick Links explanatory paragraph beneath "Everything in one place" instead
  of positioning it to the right of the heading.
- Reused the existing stacked section-title styling so no new global CSS rules were needed.
- Kept the signed-off mobile Home layout unchanged.
- Updated Home-page cache-busting query strings to v1.3.7.

Files in this update:
- index.html
- WEBSITE_UPDATE_README.txt


WEBSITE v1.3.8 - HOME DESKTOP AROUND THE CLUB & GALLERY POLISH
---------------------------------------------------------------
- Tidied the Home page desktop layout for the Around the Club heading.
- Moved the explanatory paragraph beneath "Cricket, community & club life"
  so it matches the approved Match Centre and Quick Links heading layout.
- Reworked the Home gallery so all five images form a complete collage rather
  than leaving one photo on a row by itself.
- Moved the portrait club-group image into the tall feature position and
  arranged the remaining four images as a balanced 2 x 2 group beside it.
- Changed the desktop gallery to three equal columns so the tall portrait image
  keeps a more natural crop.
- Kept the approved mobile Home layout intact.
- Updated Home-page cache-busting query strings to v1.3.8.

Files in this update:
- index.html
- assets/css/style.css
- WEBSITE_UPDATE_README.txt


WEBSITE v1.3.9 - HOME MOBILE CLUB INTRO HEADING FIT
-----------------------------------------------------
- Final mobile polish for the Home page club-introduction heading.
- Changed "More than just the score." to use responsive mobile sizing so it
  reduces with the screen width in the same way as the other Home headings.
- Kept the full heading on one line on mobile rather than allowing it to wrap.
- Kept the approved desktop Home layout unchanged.
- Updated Home-page cache-busting query strings to v1.3.9.

Files in this update:
- index.html
- assets/css/style.css
- WEBSITE_UPDATE_README.txt

WEBSITE v1.3.10 - LIVE SCOREBOARD SECOND-INNINGS DATA FIX
----------------------------------------------------------
- Fixed the public live scoreboard so the previous innings total is visible during a chase.
- Second-innings chase display now keeps TARGET, LAST INNINGS SCORE and NEED visible;
  required run rate is retained alongside the NEED label.
- Updated the live scoreboard iframe/full-screen cache-busting query string to v1.3.10.
- Updated the live-scoreboard config-script cache-busting query string to v1.3.10.
- The corresponding scoring-PC bridge fix is released as scoreboard v12.2.

Files in this update:
- live.html
- live-scoreboard.html
- WEBSITE_UPDATE_README.txt

Website v1.3.23 — End of Season Dinner checkout draft
- Replaced shop coming-soon page with event ticket basket, booking form and
  Square Web Payments card form on lindsellcc.co.uk.
- Added a Supabase Edge Function with server-calculated pricing, Square Orders
  and Payments API calls, and private booking records. The backend is packaged
  outside the Website directory.
- Sales are closed pending real dinner details and payment credentials.
- Updated the Live page shop link to remain on the club website.

Website v1.3.24 — Awards Dinner Square item integration draft
- Added the four existing Square Online Awards Dinner items to the shop draft.
- Added per-guest menu and name fields; optional cheese course is £8.95.
- The backend looks up Square Catalog prices and sold-out status and orders
  existing Square variations, with price validation before charging.
- Sales remain closed pending production credentials and live checkout tests.

Awards Dinner clarification — dinner price confirmed at £40; the £8.95 cheese course is optional. The checkout disables dinner if Square Catalog shows a different base price.
Event confirmed: Friday 23 October 2026, 7pm at The Green Man, Lindsell.
