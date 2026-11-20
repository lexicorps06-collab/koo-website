# Koo

Editorial e-commerce website for Koo, a shop for African clothing, accessories and antique cloth.

Static HTML, no build step. Fonts load from Google Fonts. All imagery is original SVG artwork.

## How it works

`app.js` runs the shop in the browser, with no server:

- **Bag:** add, change quantity and remove. Archive pieces can only be reserved once. The bag is saved in the browser.
- **Currency:** naira, dollars, pounds, euros, cedis and shillings, from the header, footer or phone menu. Rates are estimates.
- **Shop:** filter by category, fabric, country and price, and sort by price.
- **Search:** type or follow a link like `search.html?q=kente`. Accents are ignored, so "aso oke" finds aṣọ-oke.
- **Checkout:**
  - Country sets the currency, shipping prices and import duties.
  - Shipping and payment options update the total.
  - Every field is checked before paying.
  - The confirmation page shows the order.
- **Forms:** newsletter, contact and "Ask a question" check what you type and confirm when sent.

No real payment is taken. Checkout is a working prototype.

## Testing

`usetest.py` (kept outside this repo) clicks through 68 checks on desktop and phone: links, filters, currency, bag, checkout validation, ordering, forms, the phone menu and JavaScript errors.

## Motion

`motion.css` and `motion.js` add:

- a page entrance: headline words rise out of a mask, the figure rises and the image strip weaves in
- a scroll moment on the home page: "Ad" and "ire" part as the adire kaftan rises between them
- the archive cards fanning out when the section comes into view
- a close-up of the cloth when you hover a product card
- feedback on size, colour, filters, shipping options, the product details and add to bag
- cross-page view transitions (Chrome, Edge and Safari 18.2+)

All motion is off when the visitor's system asks for reduced motion.

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| Shop: clothing | `shop.html` |
| Product pages (12) | `product-*.html` (`product.html` is the kaftan) |
| Archive | `archive.html` |
| Archive pieces (5) | `archive-0.html` to `archive-4.html` |
| Journal | `journal.html` |
| Article | `article.html` |
| Know your cloth | `know-your-cloth.html` |
| About and makers | `makers.html` |
| Search | `search.html` |
| Bag | `bag.html` |
| Checkout | `checkout.html` |
| Order confirmed | `confirmation.html` |
| Help (shipping, returns, size guide, gift cards, contact, privacy, terms) | `help.html` |

Prices, names and stories are sample content.

## Mobile

`mobile.css` lays every page out for phones (760px and below): a Menu button opens a full-screen menu, grids drop to two columns, side-by-side layouts stack, and filters and chips scroll sideways. Between 761px and 1439px the desktop layout is scaled to fit the screen.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

## Deploy

Deployed on Vercel as a static site. Pushing to `main` redeploys.
