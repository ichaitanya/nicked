# Staging package checks

Run on 26 October 2026.

- `npm run typecheck` — passed.
- `npm run build` — passed; Vite produced the static site in `dist/`.
- Catalogue consistency check — passed; the seed contains exactly nine products, and each product image exists in both the frontend assets and plugin package.
- Visual asset review — checked the product crops and removed the still-unconfirmed free-from and heat claims from the relevant packaging images.
- Local preview — returned HTTP 200 at `http://127.0.0.1:5173/`.
- WordPress / WooCommerce runtime, PHP lint, gateway, shipping, email, and order flows — not run. This workspace has no PHP CLI or WordPress staging host and no payment/shipping/email accounts were configured.

The local storefront can be previewed at `http://127.0.0.1:5173/` while the development server is running. The local preview is not connected to a WooCommerce store.
