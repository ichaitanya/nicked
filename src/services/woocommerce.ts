import { demoProducts, type StoreProduct } from "../data/catalog";

const base = (import.meta.env.VITE_WP_BASE_URL as string | undefined)?.replace(/\/+$/, "");
const CART_TOKEN_KEY = "nicked_wc_cart_token";

export const commerceConnected = Boolean(base);

type StoreApiPrice = {
  price: string;
  regular_price: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
};

type StoreApiProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  prices: StoreApiPrice;
  images: Array<{ src: string; alt?: string }>;
  categories: Array<{ name: string; slug: string }>;
  is_in_stock: boolean;
  is_purchasable: boolean;
  attributes?: Array<{ name: string; terms: Array<{ name: string }> }>;
};

export type StoreCartItem = {
  key: string;
  id: number;
  name: string;
  quantity: number;
  prices: StoreApiPrice;
  totals: {
    line_total: string;
    line_total_tax: string;
  };
  images: Array<{ src: string; alt?: string }>;
};

export type StoreCart = {
  items: StoreCartItem[];
  items_count: number;
  totals: {
    total_items: string;
    total_items_tax: string;
    total_fees: string;
    total_fees_tax: string;
    total_discount: string;
    total_discount_tax: string;
    total_shipping: string;
    total_shipping_tax: string;
    total_tax: string;
    total_price: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
  };
  shipping_rates?: Array<{
    package_id: number;
    name: string;
    destination: { address: string; city: string; postcode: string; state: string; country: string };
    shipping_rates: Array<{
      rate_id: string;
      name: string;
      price: string;
      selected: boolean;
      currency_code: string;
      currency_symbol: string;
      currency_minor_unit: number;
    }>;
  }>;
  coupons?: Array<{ code: string; discount: string; discount_tax: string }>;
};

function apiUrl(path: string): string {
  if (!base) throw new Error("WordPress and WooCommerce are not connected yet.");
  return base + path;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = window.sessionStorage.getItem(CART_TOKEN_KEY);
  if (token) headers.set("Cart-Token", token);

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: "include"
  });

  const nextToken = response.headers.get("Cart-Token");
  if (nextToken) window.sessionStorage.setItem(CART_TOKEN_KEY, nextToken);
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload && typeof payload.message === "string" ? payload.message : "The store could not complete that request.";
    throw new Error(detail);
  }
  return payload as T;
}

export function formatMinorUnits(
  value: string | number,
  currency: string,
  minorUnit: number,
  currencySymbol?: string,
  prefix?: string,
  suffix?: string
): string {
  const amount = Number(value) / Math.pow(10, minorUnit);
  if (!Number.isFinite(amount)) return "Price unavailable";
  const number = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: minorUnit
  }).format(amount);
  if (prefix || suffix) return (prefix || currencySymbol || currency + " ") + number + (suffix || "");
  return (currencySymbol || currency + " ") + number;
}

export async function fetchCatalogue(): Promise<StoreProduct[]> {
  if (!base) return demoProducts;
  const products = await request<StoreApiProduct[]>("/wp-json/wc/store/v1/products?per_page=100&orderby=menu_order&order=asc");
  const editorial = await request<Array<{
    slug: string;
    range?: string;
    concern?: string;
    tagline?: string;
    summary?: string;
    key_points?: string[];
    ideal_for?: string;
    how_to_use?: string;
    ingredients?: string;
    size?: string;
  }>>("/wp-json/nicked/v1/catalogue").catch(() => []);
  const editorialBySlug = new Map(editorial.map((entry) => [entry.slug, entry]));
  const knownBySlug = new Map(demoProducts.map((product) => [product.id, product]));

  return products.map((item) => {
    const known = knownBySlug.get(item.slug);
    const safe = editorialBySlug.get(item.slug);
    const sizeFromAttribute = item.attributes?.find((attribute) => attribute.name.toLowerCase().includes("size"))?.terms[0]?.name;
    const money = item.prices;
    return {
      id: item.slug,
      wooId: item.id,
      name: item.name,
      size: safe?.size || sizeFromAttribute || "",
      range: safe?.range || "",
      type: known?.type || "",
      concern: safe?.concern || "",
      categories: item.categories.map((category) => category.name),
      price: Number(money.price) / Math.pow(10, money.currency_minor_unit),
      priceText: formatMinorUnits(money.price, money.currency_code, money.currency_minor_unit, money.currency_symbol, money.currency_prefix, money.currency_suffix),
      priceLabel: "WooCommerce",
      image: item.images[0]?.src || known?.image || "",
      alt: item.images[0]?.alt || known?.alt || item.name,
      tagline: safe?.tagline || "",
      summary: safe?.summary || undefined,
      keyPoints: safe?.key_points || [],
      idealFor: safe?.ideal_for || undefined,
      howToUse: safe?.how_to_use || undefined,
      ingredients: safe?.ingredients || undefined,
      inStock: item.is_in_stock,
      purchasable: item.is_purchasable,
      isPreview: false,
      tint: known?.tint || "#F3EADB"
    };
  });
}

export function fetchCart(): Promise<StoreCart> {
  return request<StoreCart>("/wp-json/wc/store/v1/cart");
}

export function addCartItem(productId: number, quantity: number): Promise<StoreCart> {
  return request<StoreCart>("/wp-json/wc/store/v1/cart/add-item", {
    method: "POST",
    body: JSON.stringify({ id: productId, quantity })
  });
}

export function updateCartItem(key: string, quantity: number): Promise<StoreCart> {
  return request<StoreCart>("/wp-json/wc/store/v1/cart/update-item", {
    method: "POST",
    body: JSON.stringify({ key, quantity })
  });
}

export function removeCartItem(key: string): Promise<StoreCart> {
  return request<StoreCart>("/wp-json/wc/store/v1/cart/remove-item", {
    method: "POST",
    body: JSON.stringify({ key })
  });
}

export function applyCoupon(code: string): Promise<StoreCart> {
  return request<StoreCart>("/wp-json/wc/store/v1/cart/apply-coupon", {
    method: "POST",
    body: JSON.stringify({ code })
  });
}

export function removeCoupon(code: string): Promise<StoreCart> {
  return request<StoreCart>("/wp-json/wc/store/v1/cart/remove-coupon", {
    method: "POST",
    body: JSON.stringify({ code })
  });
}

export type CheckoutState = {
  billing_address: Record<string, string>;
  shipping_address: Record<string, string>;
  payment_methods: string[];
  needs_payment: boolean;
  needs_shipping: boolean;
  extensions?: Record<string, unknown>;
};

export function fetchCheckoutState(): Promise<CheckoutState> {
  return request<CheckoutState>("/wp-json/wc/store/v1/checkout");
}

export function submitCheckout(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>("/wp-json/wc/store/v1/checkout", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function requestTracking(orderNumber: string, verification: string): Promise<{
  status: string;
  timeline: Array<{ label: string; date?: string; complete: boolean }>;
  tracking_url?: string;
  courier?: string;
}> {
  return request("/wp-json/nicked/v1/orders/track", {
    method: "POST",
    body: JSON.stringify({ order_number: orderNumber, verification })
  });
}

export function getWordPressBase(): string {
  return base || "";
}

export type PublicStoreSettings = {
  support_phone?: string;
  whatsapp_number?: string;
  support_email?: string;
  instagram_url?: string;
  facebook_url?: string;
  announcement?: string;
  hero_headline?: string;
  hero_intro?: string;
  hero_chips?: string;
  coupons_enabled?: boolean;
};

export function fetchPublicSettings(): Promise<PublicStoreSettings> {
  if (!base) return Promise.resolve({});
  return request<PublicStoreSettings>("/wp-json/nicked/v1/settings");
}

export type PublicPolicy = {
  title: string;
  content: string;
  status: "draft" | "owner-to-confirm" | "published";
};

export function fetchPolicies(): Promise<Record<string, PublicPolicy>> {
  if (!base) return Promise.resolve({});
  return request<Record<string, PublicPolicy>>("/wp-json/nicked/v1/policies");
}
