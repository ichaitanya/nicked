# NICKED staging storefront

This package contains a mobile-first React storefront and a WordPress/WooCommerce plugin for the NICKED staging build. It is a local build package; no WordPress host, payment account, shipping account, or live domain was supplied, so nothing has been deployed or connected to a live store.

## Local storefront preview

1. Install Node.js 20.19+ or 22.12+.
2. From this folder, run `npm install` and then `npm run dev`.
3. The preview uses the nine products from the supplied catalogue. Without a WordPress URL, product cards are a visual catalogue only: it does not simulate a cart, stock, tax, shipping, payment, or order status.

Set `VITE_WP_BASE_URL` in a local `.env.local` file to the WordPress staging base URL when one is available. This URL is public configuration, not a secret. Do not add gateway keys, passwords, or API secrets to the frontend environment.

## WordPress admin package

Requirements: WordPress 6.6+, PHP 8.1+, and WooCommerce. Copy `wordpress/wp-content/plugins/nicked-commerce-bridge` into the WordPress `wp-content/plugins/` folder and activate **NICKED Commerce Bridge**. Then open **NICKED Overview** in the WordPress admin and choose **Create draft catalogue**.

The seeder creates the nine catalogue products as drafts with stock set to zero. It imports the catalogue images and keeps unresolved claims, product corrections, and owner notes out of public fields. Products can be added, edited, archived, restored, or removed through WooCommerce Products. Products with past orders are archived as private products to preserve order history.

The WordPress dashboard and NICKED Overview show recent orders, order counts by status, paid sales and refunds for the last 30 days, stock alerts, best sellers, and subscription totals when the WooCommerce Subscriptions extension is available. WooCommerce remains the source for product, order, stock, tax, coupon, shipping, and payment data.

## Before accepting orders

Complete the owner checklist in `docs/OWNER-CHECKLIST.md`. Configure the store’s legal and listing details, operational policies, tax settings, shipping, payment gateway, email delivery, and any subscription service in WordPress/WooCommerce. The storefront keeps the checkout button disabled until the terms and privacy policies are both published; the plugin also blocks Store API checkout while either policy is still a draft.

For a separate frontend domain, enter that exact HTTPS origin in **NICKED Overview → Storefront origin**. Keep staging and production credentials in the server or payment provider’s secure settings. Use the official WooCommerce integrations for Razorpay and Shiprocket, then test successful, failed, pending, cancelled, refund, shipping, and notification flows before launch.

## Build and type checks

- `npm run typecheck`
- `npm run build`

The generated static site is in `dist/`. Deploy it only after connecting it to a staging WordPress/WooCommerce site and completing the owner checklist.
