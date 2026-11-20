# Koo

Editorial e-commerce website for Koo, a shop for African clothing, accessories and antique cloth.

Static HTML, no build step. Fonts load from Google Fonts. All imagery is original SVG artwork.

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
| Product | `product.html` |
| Archive | `archive.html` |
| Archive piece | `archive-piece.html` |
| Journal | `journal.html` |
| Article | `article.html` |
| Know your cloth | `know-your-cloth.html` |
| About and makers | `makers.html` |
| Search | `search.html` |
| Bag | `bag.html` |
| Checkout | `checkout.html` |
| Order confirmed | `confirmation.html` |

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
