import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode
} from "react";
import {
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  categoryLabels,
  concernLabels,
  demoProducts,
  rangeLabels,
  routineSets,
  type StoreProduct
} from "./data/catalog";
import {
  commerceConnected,
  fetchCheckoutState,
  fetchPolicies,
  fetchPublicSettings,
  formatMinorUnits,
  getWordPressBase,
  requestTracking,
  submitCheckout,
  type PublicPolicy,
  type StoreCart
} from "./services/woocommerce";
import { useStorefront } from "./services/StorefrontContext";

type IconName = "bag" | "heart" | "home" | "search" | "user" | "menu" | "arrow" | "close" | "phone" | "whatsapp" | "sparkle" | "filter" | "chevron";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const
  };
  const paths: Record<IconName, ReactNode> = {
    bag: <><path d="M5 8.5h14l1 12H4l1-12Z" /><path d="M9 8.5V6a3 3 0 0 1 6 0v2.5" /></>,
    heart: <path d="M20.8 8.8c0 5.1-8.8 10-8.8 10s-8.8-4.9-8.8-10a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z" />,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9.5V21h14V9.5M9.5 21v-7h5v7" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    user: <><circle cx="12" cy="8" r="3.6" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    arrow: <><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    phone: <><path d="M8 3H5.8A1.8 1.8 0 0 0 4 4.8c0 8.4 6.8 15.2 15.2 15.2a1.8 1.8 0 0 0 1.8-1.8V16l-4-1-1.5 2.2a13 13 0 0 1-5.9-5.9L11.8 9 11 5 8 3Z" /></>,
    whatsapp: <><path d="M20.4 11.7a8.4 8.4 0 0 1-12.5 7.2L3 20l1.2-4.7a8.4 8.4 0 1 1 16.2-3.6Z" /><path d="M8.7 8.5c.4 2.7 2.4 4.7 5.1 5.2l1-1.1 2 .9c-.5 1.7-1.8 2-3.1 1.6-3-.9-5.3-3.2-6-6.1-.3-1.3.1-2.6 1.8-3l.8 2.1-1.6.4Z" /></>,
    sparkle: <><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    filter: <><path d="M4 6h16M7 12h10m-7 6h4" /><circle cx="8" cy="6" r="1.5" fill="currentColor" /><circle cx="15" cy="12" r="1.5" fill="currentColor" /></>,
    chevron: <path d="m7 10 5 5 5-5" />
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Price({ product, compact = false }: { product: StoreProduct; compact?: boolean }) {
  const amount = product.priceText || new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(product.price);
  return (
    <span className={compact ? "price price--compact" : "price"}>
      <strong>{amount}</strong>
      <small>{product.priceLabel === "WooCommerce" ? "WooCommerce price" : "Printed MRP · inclusive of taxes"}</small>
    </span>
  );
}

function useCartCount() {
  const { cart } = useStorefront();
  return cart?.items_count || 0;
}

function Header() {
  const cartCount = useCartCount();
  const { favourites } = useStorefront();
  const settings = useQuery({
    queryKey: ["public-settings"],
    queryFn: fetchPublicSettings,
    enabled: commerceConnected,
    staleTime: 60_000
  }).data;
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="notice-bar">
        <span>Purpose-Driven Care for Better Hair</span>
        <span className="preview-stamp">Staging preview · checkout is not live</span>
      </div>
      {settings?.announcement ? <div className="announcement">{settings.announcement}</div> : null}
      <header className="site-header">
        <Link to="/" className="brand" aria-label="NICKED Hair Care home">
          <img src="/assets/nicked-logo.webp" alt="NICKED Hair Care™" />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/routines">Routines</NavLink>
          <a href="/#story">Our story</a>
          <NavLink to="/support">Support</NavLink>
        </nav>
        <div className="header-actions">
          {settings?.support_phone ? (
            <a className="support-action" href={"tel:" + settings.support_phone}><Icon name="phone" /><span>Call</span></a>
          ) : null}
          {settings?.whatsapp_number ? (
            <a className="support-action" href={"https://wa.me/" + settings.whatsapp_number.replace(/\D/g, "") + "?text=Hi%20NICKED%2C%20I%20need%20assistance%20with%20a%20product%20or%20order."} target="_blank" rel="noreferrer"><Icon name="whatsapp" /><span>WhatsApp</span></a>
          ) : null}
          <Link className="icon-link desktop-icon" to="/wishlist" aria-label={"Wishlist, " + favourites.length + " saved products"}><Icon name="heart" /><span className="count-dot">{favourites.length}</span></Link>
          <Link className="icon-link" to="/account" aria-label="Your account"><Icon name="user" /></Link>
          <Link className="icon-link cart-link" to="/cart" aria-label={"Cart, " + cartCount + " items"}><Icon name="bag" /><span className="count-dot">{cartCount}</span></Link>
        </div>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <img src="/assets/nicked-logo.webp" alt="NICKED Hair Care™" />
          <p>Purpose-Driven Care for Better Hair.</p>
          <p className="muted">A Cosmofix Trade Private Limited Brand · Established 2021</p>
        </div>
        <div>
          <p className="footer-title">Explore</p>
          <Link to="/shop">Shop all</Link>
          <Link to="/routines">Routines</Link>
          <Link to="/track">Track an order</Link>
        </div>
        <div>
          <p className="footer-title">Help & information</p>
          <Link to="/support">Contact and support</Link>
          <Link to="/policies/shipping">Shipping</Link>
          <Link to="/policies/returns">Returns & refunds</Link>
          <Link to="/policies/privacy">Privacy</Link>
          <Link to="/policies/terms">Terms</Link>
        </div>
        <div className="footer-note">
          <span className="eyebrow">Owner setup</span>
          <p>Support contacts, policies, delivery and business details are editable in the WordPress admin. Unconfirmed fields stay marked for review.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} NICKED Professional Hair Care</span>
        <span>Secure checkout becomes available after WooCommerce setup.</span>
      </div>
    </footer>
  );
}

function BottomNav() {
  const cartCount = useCartCount();
  const { favourites } = useStorefront();
  const items = [
    { to: "/", label: "Home", icon: "home" as const },
    { to: "/shop", label: "Shop", icon: "search" as const },
    { to: "/routines", label: "Routines", icon: "sparkle" as const },
    { to: "/wishlist", label: "Saved", icon: "heart" as const, count: favourites.length },
    { to: "/cart", label: "Cart", icon: "bag" as const, count: cartCount }
  ];
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => (
        <NavLink to={item.to} end={item.to === "/"} key={item.label} className={({ isActive }) => isActive ? "bottom-nav-link is-active" : "bottom-nav-link"}>
          <span className="bottom-icon-wrap"><Icon name={item.icon} size={19} />{item.count ? <span className="bottom-count">{item.count}</span> : null}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function AppLayout() {
  const { notice, clearNotice } = useStorefront();
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(clearNotice, 4400);
    return () => window.clearTimeout(timeout);
  }, [notice, clearNotice]);
  return (
    <div className="app-shell">
      <Header />
      <main id="main-content"><Outlet /></main>
      <Footer />
      <BottomNav />
      {notice ? <div role="status" className="toast"><span>{notice}</span><button aria-label="Dismiss message" onClick={clearNotice}><Icon name="close" size={16} /></button></div> : null}
    </div>
  );
}

function ProductCard({ product, index = 0 }: { product: StoreProduct; index?: number }) {
  const { addToCart, favourites, toggleFavourite } = useStorefront();
  const saved = favourites.includes(product.id);
  return (
    <article className="product-card" style={{ animationDelay: (index * 45) + "ms" }}>
      <div className="product-card-image" style={{ backgroundColor: product.tint }}>
        <Link to={"/products/" + product.id} className="product-image-link" aria-label={"View " + product.name}>
          <img loading="lazy" src={product.image} alt={product.alt} />
        </Link>
        <button
          type="button"
          className={saved ? "favourite-button is-saved" : "favourite-button"}
          aria-label={saved ? "Remove " + product.name + " from saved products" : "Save " + product.name}
          aria-pressed={saved}
          onClick={() => toggleFavourite(product.id)}
        >
          <Icon name="heart" size={19} />
        </button>
        <span className="range-chip">{product.range || product.type}</span>
      </div>
      <div className="product-card-copy">
        <Link className="product-title" to={"/products/" + product.id}>{product.name}</Link>
        <p className="product-size">{product.size || "Size to be confirmed"}</p>
        <p className="product-tagline">{product.tagline}</p>
        <div className="product-card-foot">
          <Price product={product} compact />
          <button type="button" className="quick-add" onClick={() => void addToCart(product)} aria-label={"Add " + product.name + " to cart"}>Add <span aria-hidden="true">+</span></button>
        </div>
      </div>
    </article>
  );
}

function SectionHeading({ kicker, title, description, linkTo, linkLabel }: {
  kicker?: string;
  title: string;
  description?: string;
  linkTo?: string;
  linkLabel?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {kicker ? <span className="eyebrow">{kicker}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {linkTo && linkLabel ? <Link to={linkTo} className="text-link">{linkLabel}<Icon name="arrow" size={16} /></Link> : null}
    </div>
  );
}

function HomePage() {
  const { products, loading, catalogueError, addToCart, addRoutine } = useStorefront();
  const settingsQuery = useQuery({
    queryKey: ["public-settings"],
    queryFn: fetchPublicSettings,
    enabled: commerceConnected,
    staleTime: 60_000
  });
  const settings = settingsQuery.data;
  const [selectedNeed, setSelectedNeed] = useState("Hydrate");
  const [ingredientFilter, setIngredientFilter] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const heroMap: Record<string, string> = {
    Hydrate: "nicked-marula-oil-hydration-shampoo",
    "Scalp care": "nicked-tea-tree-rejuvenating-shampoo",
    "Post-treatment": "nicked-post-treatment-shampoo",
    "Style & protect": "nicked-heat-protection-spray"
  };
  const configuredChoices = (settings?.hero_chips || "")
    .split(/\r?\n/)
    .map((line) => line.split("|"))
    .filter((parts) => parts.length === 2 && parts[0].trim() && parts[1].trim())
    .map(([label, slug]) => [label.trim(), slug.trim()] as const);
  const choices = configuredChoices.length ? configuredChoices : Object.entries(heroMap);
  const activeChoice = choices.find(([label]) => label === selectedNeed) || choices[0];
  const heroProduct = products.find((product) => product.id === activeChoice?.[1]) || products[2] || demoProducts[2];
  const ingredients = ["Marula Oil", "Argan Oil", "Tea Tree Oil", "Keratin"];
  const ingredientProducts = ingredientFilter
    ? products.filter((product) => product.ingredients?.toLowerCase().includes(ingredientFilter.toLowerCase()))
    : [];
  const firstProducts = products.slice(0, 4);

  function scrollToConcerns() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelector("#shop-by-concern")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <>
      <section className="ritual-hero">
        <div className="hero-leaf-shadow" aria-hidden="true" />
        <div className="hero-copy">
          <span className="eyebrow"><Icon name="sparkle" size={16} /> NICKED Professional Hair Care</span>
          <h1>{settings?.hero_headline || "Professional Hair Care. Made for Your Hair."}</h1>
          <p className="hero-intro">{settings?.hero_intro || "Purpose-Driven Care for Better Hair."}</p>
          <div className="need-chips" role="group" aria-label="Choose what your hair needs">
            {choices.map(([need]) => (
              <button type="button" key={need} className={activeChoice?.[0] === need ? "need-chip is-selected" : "need-chip"} aria-pressed={activeChoice?.[0] === need} onClick={() => setSelectedNeed(need)}>{need}</button>
            ))}
          </div>
          <div className="hero-actions">
            <Link to="/shop" className="button button-primary">Shop all products <Icon name="arrow" size={17} /></Link>
            <button type="button" className="button button-text" onClick={scrollToConcerns}>Find your hair care <Icon name="arrow" size={17} /></button>
          </div>
          <p className="hero-caption">A Cosmofix Trade Private Limited Brand · Established 2021</p>
        </div>
        <div className="hero-stage" style={{ backgroundColor: heroProduct.tint }}>
          <div className="sun-dapple" aria-hidden="true" />
          <div className="plinth" aria-hidden="true" />
          <button type="button" className="hero-product-image" onClick={() => setZoom(true)} aria-label={"Enlarge image of " + heroProduct.name}>
            <img key={heroProduct.id} src={heroProduct.image} alt={heroProduct.alt} />
          </button>
          <div className="hero-product-card">
            <div>
              <span className="eyebrow">{heroProduct.range}</span>
              <h2>{heroProduct.name}</h2>
              <span className="product-size">{heroProduct.size}</span>
            </div>
            <div className="hero-card-action">
              <Price product={heroProduct} compact />
              <Link to={"/products/" + heroProduct.id} className="circle-arrow" aria-label={"Shop " + heroProduct.name}><Icon name="arrow" size={18} /></Link>
            </div>
          </div>
          <div className="hero-orbit" aria-hidden="true"><Icon name="sparkle" size={22} /></div>
        </div>
      </section>

      <section className="section concern-section" id="shop-by-concern">
        <SectionHeading kicker="A good place to start" title="Shop by what your hair needs" description="Choose a concern to find the products listed for it in the catalogue." />
        <div className="concern-grid">
          {concernLabels.map((label, index) => (
            <Link to={"/shop?concern=" + encodeURIComponent(label)} key={label} className={"concern-card concern-card-" + (index + 1)}>
              <span className="concern-number">0{index + 1}</span>
              <span>{label}</span>
              <Icon name="arrow" size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="section product-section">
        <SectionHeading kicker="The collection" title="Hair care, thoughtfully chosen" description="Nine products across five specialised ranges, as listed in the NICKED catalogue." linkTo="/shop" linkLabel="View all products" />
        {catalogueError ? <div className="inline-alert" role="status">The catalogue could not load from WooCommerce: {catalogueError}</div> : null}
        {loading ? <div className="loading-grid" aria-label="Loading products"><span /><span /><span /><span /></div> : (
          <div className="product-grid">
            {firstProducts.map((product, index) => <ProductCard product={product} key={product.id} index={index} />)}
          </div>
        )}
      </section>

      <section className="routine-band section">
        <div className="routine-band-copy">
          <span className="eyebrow">Build your ritual</span>
          <h2>Care that goes together.</h2>
          <p>Explore routines made from the nine real catalogue products. WooCommerce calculates the live total after you add them.</p>
          <Link to="/routines" className="button button-light">Explore routines <Icon name="arrow" size={17} /></Link>
        </div>
        <div className="routine-band-image">
          <img src="/assets/marula-transforming-conditioner.webp" alt="NICKED Marula Oil Transforming Conditioner bottle from the supplied catalogue" loading="lazy" />
          <span className="routine-sticker">No bundle discount<br />unless configured in WooCommerce</span>
        </div>
      </section>

      <section className="section ingredient-section">
        <div className="ingredient-intro">
          <span className="eyebrow">Ingredient explorer</span>
          <h2>Follow what is on the label.</h2>
          <p>Tap an ingredient to see products with a clear matching ingredient list. Unclear catalogue entries stay out of these results.</p>
          <div className="ingredient-chips">
            {ingredients.map((ingredient) => (
              <button type="button" key={ingredient} onClick={() => setIngredientFilter(ingredient)} className={ingredientFilter === ingredient ? "ingredient-chip is-selected" : "ingredient-chip"}>{ingredient}</button>
            ))}
          </div>
        </div>
        <div className="ingredient-results" aria-live="polite">
          {ingredientFilter ? (
            <>
              <div className="ingredient-result-heading"><span className="eyebrow">Printed list contains</span><button type="button" onClick={() => setIngredientFilter(null)} className="clear-filter">Clear</button></div>
              <h3>{ingredientFilter}</h3>
              {ingredientProducts.length ? <div className="ingredient-result-list">{ingredientProducts.map((product) => <Link to={"/products/" + product.id} key={product.id}>{product.name}<Icon name="arrow" size={16} /></Link>)}</div> : <p className="empty-note">No confirmed ingredient-list match is available yet.</p>}
            </>
          ) : (
            <div className="ingredient-prompt"><span className="leaf-mark">N</span><p>Ingredient details are shown only when the printed list is clear.</p></div>
          )}
        </div>
      </section>

      <section className="section range-section">
        <SectionHeading kicker="Five specialised ranges" title="Find your NICKED range" />
        <div className="range-list">
          {rangeLabels.map((range, index) => {
            const tint = ["#E7EBF2", "#F6E6C8", "#DDE8CF", "#E4E0F7", "#EADBCB"][index];
            return <Link to={"/shop?range=" + encodeURIComponent(range)} className="range-list-item" style={{ backgroundColor: tint }} key={range}><span className="range-index">0{index + 1}</span><span>{range}</span><Icon name="arrow" size={18} /></Link>;
          })}
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="story-image"><img src="/assets/nicked-logo.webp" alt="NICKED Hair Care™ logo from the supplied catalogue" loading="lazy" /></div>
        <div className="story-copy">
          <span className="eyebrow">The NICKED story</span>
          <h2>Purpose-Driven Care<br /><em>for Better Hair</em></h2>
          <p>NICKED Professional Hair Care brings together nine products across five specialised ranges: Argan Oil, Marula Oil, Tea Tree, Post-Treatment, and Styling & Protection.</p>
          <p className="muted">A Cosmofix Trade Private Limited Brand · Established 2021</p>
          <Link to="/shop" className="text-link">Explore the collection <Icon name="arrow" size={16} /></Link>
        </div>
      </section>

      <section className="support-strip">
        <div><span className="eyebrow">Here to help</span><h2>Need a hand with a product or order?</h2></div>
        <div className="support-strip-actions"><Link to="/support" className="button button-primary">Visit support <Icon name="arrow" size={17} /></Link><Link to="/track" className="button button-outline">Track an order</Link></div>
      </section>

      {zoom ? <div className="image-modal" role="dialog" aria-modal="true" aria-label={heroProduct.name} onClick={() => setZoom(false)}><button className="image-modal-close" aria-label="Close enlarged image" onClick={() => setZoom(false)}><Icon name="close" /></button><img src={heroProduct.image} alt={heroProduct.alt} /></div> : null}
    </>
  );
}

function CatalogPage() {
  const { products, loading, catalogueError } = useStorefront();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [category, setCategory] = useState("");
  const [range, setRange] = useState(params.get("range") || "");
  const [concern, setConcern] = useState(params.get("concern") || "");
  const [sort, setSort] = useState("featured");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesQuery = !query || [product.name, product.range, product.type, product.concern, product.tagline].join(" ").toLowerCase().includes(query);
      const matchesCategory = !category || product.categories.includes(category);
      const matchesRange = !range || product.range === range;
      const matchesConcern = !concern || product.concern.toLowerCase().includes(concern.toLowerCase().split(" ")[0]) || concern === "Smoothness & Frizz Control" && product.keyPoints.some((point) => /frizz|smooth/i.test(point));
      return matchesQuery && matchesCategory && matchesRange && matchesConcern;
    });
    if (sort === "price-low") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-high") return [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [products, search, category, range, concern, sort]);

  return (
    <div className="page-wrap">
      <div className="page-hero page-hero-shop">
        <span className="eyebrow">NICKED Professional Hair Care</span>
        <h1>The collection</h1>
        <p>Nine products across five specialised ranges. Product details follow the supplied catalogue; availability and totals come from WooCommerce once connected.</p>
      </div>
      <div className="catalog-toolbar">
        <label className="search-box"><Icon name="search" /><span className="sr-only">Search products</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shampoos, serums, ranges..." /></label>
        <label className="sort-select"><Icon name="filter" /><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><Icon name="chevron" size={16} /></label>
      </div>
      <div className="filter-row">
        <button type="button" className={!category ? "filter-pill is-selected" : "filter-pill"} onClick={() => setCategory("")}>All</button>
        {categoryLabels.map((label) => <button type="button" className={category === label ? "filter-pill is-selected" : "filter-pill"} key={label} onClick={() => setCategory(category === label ? "" : label)}>{label}</button>)}
      </div>
      <div className="filter-select-row">
        <label>Range<select value={range} onChange={(event) => setRange(event.target.value)}><option value="">All ranges</option>{rangeLabels.map((label) => <option key={label}>{label}</option>)}</select></label>
        <label>Concern<select value={concern} onChange={(event) => setConcern(event.target.value)}><option value="">All concerns</option>{concernLabels.map((label) => <option key={label}>{label}</option>)}</select></label>
        <span className="result-count">{loading ? "Loading…" : filtered.length + " products"}</span>
      </div>
      {catalogueError ? <div className="inline-alert" role="alert">Could not load the WooCommerce catalogue: {catalogueError}</div> : null}
      {loading ? <div className="loading-grid" aria-label="Loading products"><span /><span /><span /><span /></div> : filtered.length ? (
        <div className="product-grid product-grid-catalog">
          {filtered.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </div>
      ) : <div className="empty-state"><h2>No products match those filters.</h2><p>Clear a filter or search by a product name or range.</p><button className="button button-outline" onClick={() => { setCategory(""); setRange(""); setConcern(""); setSearch(""); }}>Clear filters</button></div>}
    </div>
  );
}

function ProductPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, favourites, toggleFavourite } = useStorefront();
  const product = products.find((item) => item.id === slug);
  const [quantity, setQuantity] = useState(1);
  const [expanded, setExpanded] = useState("details");
  const [zoom, setZoom] = useState(false);
  if (!product) return <div className="page-wrap empty-state"><h1>Product not found</h1><Link to="/shop" className="button button-primary">Back to the collection</Link></div>;
  const selectedProduct = product;
  const related = products.filter((item) => item.id !== product.id && item.range === product.range).slice(0, 3);
  const saved = favourites.includes(product.id);
  const availability = !commerceConnected
    ? "Availability is set by the owner in WooCommerce."
    : product.inStock === false
      ? "Currently unavailable"
      : product.inStock === true
        ? "Available"
        : "Availability will appear after WooCommerce responds.";

  async function addAndGo() {
    await addToCart(selectedProduct, quantity);
    navigate("/checkout");
  }

  return (
    <div className="page-wrap product-page">
      <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><span>{product.name}</span></div>
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="product-hero-image" style={{ backgroundColor: product.tint }}>
            <img src={product.image} alt={product.alt} onClick={() => setZoom(true)} />
            <button className={saved ? "favourite-button is-saved" : "favourite-button"} onClick={() => toggleFavourite(product.id)} aria-pressed={saved} aria-label={saved ? "Remove from saved products" : "Save product"}><Icon name="heart" /></button>
            <button className="zoom-button" onClick={() => setZoom(true)}>View image</button>
          </div>
          <p className="image-source-note">Product image from the supplied NICKED catalogue.</p>
        </div>
        <div className="product-detail-copy">
          <span className="eyebrow">{product.range}</span>
          <h1>{product.name}</h1>
          <p className="product-tagline large">{product.tagline}</p>
          <div className="detail-price-row"><Price product={product} /><span className="size-pill">{product.size}</span></div>
          <p className="availability"><span className={product.inStock === false ? "availability-dot unavailable" : "availability-dot"} />{availability}</p>
          {product.summary ? <p className="product-summary">{product.summary}</p> : <p className="owner-confirm-note">Product overview is being confirmed by the owner.</p>}
          <div className="detail-controls">
            <div className="quantity-control" aria-label="Quantity">
              <button aria-label="Decrease quantity" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <span aria-live="polite">{quantity}</span>
              <button aria-label="Increase quantity" onClick={() => setQuantity(Math.min(20, quantity + 1))}>+</button>
            </div>
            <button className="button button-primary add-detail" disabled={product.inStock === false} onClick={() => void addToCart(product, quantity)}>Add to cart <Icon name="bag" size={17} /></button>
          </div>
          <button className="button button-outline buy-now" disabled={product.inStock === false} onClick={() => void addAndGo()}>Buy now <Icon name="arrow" size={17} /></button>
          <p className="shipping-note">Shipping, tax and any delivery charge are calculated by WooCommerce at checkout. No estimate is shown in this preview.</p>
          <div className="product-accordions">
            <Accordion title="Key details" id="details" open={expanded === "details"} onToggle={setExpanded}>
              <p>{product.concern || "Product concern to be confirmed."}</p>
              {product.idealFor ? <p><strong>Ideal for:</strong> {product.idealFor}</p> : <p className="muted">Ideal-for details are being confirmed by the owner.</p>}
              {product.keyPoints.length ? <ul className="detail-list">{product.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul> : <p className="muted">Key details are being confirmed by the owner.</p>}
            </Accordion>
            <Accordion title="How to use" id="usage" open={expanded === "usage"} onToggle={setExpanded}>
              {product.howToUse ? <p>{product.howToUse}</p> : <p className="owner-confirm-note">How-to-use text is not available in the catalogue and is awaiting owner confirmation.</p>}
            </Accordion>
            <Accordion title="Ingredients" id="ingredients" open={expanded === "ingredients"} onToggle={setExpanded}>
              {product.ingredients ? <p className="ingredients-copy">{product.ingredients}</p> : <p className="owner-confirm-note">The printed ingredient list is unclear or awaiting owner confirmation.</p>}
            </Accordion>
          </div>
        </div>
      </div>
      {related.length ? <section className="section related-section"><SectionHeading kicker="From the same range" title="Continue your ritual" /><div className="product-grid">{related.map((item, index) => <ProductCard product={item} key={item.id} index={index} />)}</div></section> : null}
      <div className="sticky-buy-bar"><div><strong>{product.name}</strong><Price product={product} compact /></div><button className="button button-primary" disabled={product.inStock === false} onClick={() => void addToCart(product, quantity)}>Add to cart</button></div>
      {zoom ? <div className="image-modal" role="dialog" aria-modal="true" aria-label={product.name} onClick={() => setZoom(false)}><button className="image-modal-close" aria-label="Close enlarged image"><Icon name="close" /></button><img src={product.image} alt={product.alt} /></div> : null}
    </div>
  );
}

function Accordion({ title, id, open, onToggle, children }: { title: string; id: string; open: boolean; onToggle: (id: string) => void; children: ReactNode }) {
  return (
    <section className="accordion">
      <h2><button type="button" aria-expanded={open} onClick={() => onToggle(open ? "" : id)}>{title}<span className={open ? "accordion-mark is-open" : "accordion-mark"}>+</span></button></h2>
      {open ? <div className="accordion-body">{children}</div> : null}
    </section>
  );
}

function RoutinesPage() {
  const { products, addRoutine } = useStorefront();
  return (
    <div className="page-wrap">
      <div className="page-hero">
        <span className="eyebrow">Routines</span>
        <h1>A few good things,<br /><em>in the right order.</em></h1>
        <p>Curated from the nine products in the NICKED catalogue. There are no bundle discounts in this preview; WooCommerce calculates actual totals.</p>
      </div>
      <div className="routine-grid">
        {routineSets.map((routine, index) => {
          const items = routine.productIds.map((id) => products.find((product) => product.id === id)).filter((item): item is StoreProduct => Boolean(item));
          return (
            <article className={"routine-card routine-card-" + (index + 1)} key={routine.name}>
              <span className="routine-number">Routine 0{index + 1}</span>
              <h2>{routine.name}</h2>
              <ol>{items.map((product) => <li key={product.id}><Link to={"/products/" + product.id}>{product.name}</Link><span>{product.size}</span></li>)}</ol>
              <p className="routine-total-note">Live total from WooCommerce after adding. No bundle discount assumed.</p>
              <button className="button button-primary" onClick={() => void addRoutine(items)}>Add this routine <Icon name="arrow" size={17} /></button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function WishlistPage() {
  const { products, favourites } = useStorefront();
  const saved = products.filter((product) => favourites.includes(product.id));
  return (
    <div className="page-wrap">
      <div className="page-hero page-hero-short"><span className="eyebrow">Saved products</span><h1>Your wishlist</h1><p>Saved on this device for the preview.</p></div>
      {saved.length ? <div className="product-grid product-grid-catalog">{saved.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="heart" size={28} /></span><h2>No saved products yet.</h2><p>Tap the heart on a product to keep it here.</p><Link to="/shop" className="button button-primary">Explore the collection</Link></div>}
    </div>
  );
}

function MoneyLine({ label, value, totals }: { label: string; value: string; totals: StoreCart["totals"] }) {
  return <div className="money-line"><span>{label}</span><strong>{formatMinorUnits(value, totals.currency_code, totals.currency_minor_unit, totals.currency_symbol, totals.currency_prefix, totals.currency_suffix)}</strong></div>;
}

function CartPage() {
  const { products, cart, cartLoading, cartError, isConnected, setQuantity, removeFromCart, coupon } = useStorefront();
  const settingsQuery = useQuery({ queryKey: ["public-settings"], queryFn: fetchPublicSettings, enabled: isConnected, staleTime: 60_000 });
  const [couponText, setCouponText] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  async function apply(event: FormEvent) {
    event.preventDefault();
    if (!couponText.trim()) return;
    try {
      await coupon(couponText.trim());
      setCouponMessage("WooCommerce updated the cart.");
    } catch (error) {
      setCouponMessage(error instanceof Error ? error.message : "WooCommerce could not apply that coupon.");
    }
  }
  return (
    <div className="page-wrap cart-page">
      <div className="page-hero page-hero-short"><span className="eyebrow">Your bag</span><h1>Shopping cart</h1><p>Cart totals, taxes and shipping are calculated by WooCommerce.</p></div>
      {!isConnected ? <div className="connection-card"><span className="eyebrow">Staging setup</span><h2>WooCommerce is not connected yet.</h2><p>This preview does not keep a local cart or estimate totals. Add the WordPress URL to enable cart, stock, tax and shipping from WooCommerce.</p><Link to="/shop" className="button button-primary">Continue shopping</Link></div> : null}
      {cartError ? <div className="inline-alert" role="alert">WooCommerce could not load the cart: {cartError}</div> : null}
      {cartLoading && isConnected ? <p className="loading-note">Loading your WooCommerce cart…</p> : null}
      {cart && cart.items.length ? (
        <div className="cart-layout">
          <div className="cart-lines">
            {cart.items.map((item) => (
              <article className="cart-line" key={item.key}>
                <img src={item.images[0]?.src || ""} alt={item.images[0]?.alt || item.name} />
                <div className="cart-line-copy"><Link to={"/products/" + (products.find((product) => product.wooId === item.id)?.id || "")}>{item.name}</Link><span>WooCommerce price: {formatMinorUnits(item.prices.price, item.prices.currency_code, item.prices.currency_minor_unit, item.prices.currency_symbol, item.prices.currency_prefix, item.prices.currency_suffix)}</span><button type="button" className="text-button" onClick={() => removeFromCart(item.key)}>Remove</button></div>
                <div className="quantity-control cart-quantity"><button aria-label={"Decrease " + item.name + " quantity"} onClick={() => setQuantity(item.key, item.quantity - 1)}>−</button><span>{item.quantity}</span><button aria-label={"Increase " + item.name + " quantity"} onClick={() => setQuantity(item.key, item.quantity + 1)}>+</button></div>
                <strong className="cart-line-total">{formatMinorUnits(item.totals.line_total, item.prices.currency_code, item.prices.currency_minor_unit, item.prices.currency_symbol, item.prices.currency_prefix, item.prices.currency_suffix)}</strong>
              </article>
            ))}
            <Link to="/shop" className="text-link">Continue shopping <Icon name="arrow" size={16} /></Link>
          </div>
          <aside className="order-summary">
            <h2>Order summary</h2>
            {settingsQuery.data?.coupons_enabled ? <form className="coupon-form" onSubmit={apply}><label htmlFor="coupon">Coupon code</label><div><input id="coupon" value={couponText} onChange={(event) => setCouponText(event.target.value)} placeholder="Enter code" /><button type="submit">Apply</button></div>{couponMessage ? <p role="status">{couponMessage}</p> : null}</form> : null}
            {cart.coupons?.map((entry) => <div className="coupon-applied" key={entry.code}>Coupon {entry.code} applied</div>)}
            <MoneyLine label="Items" value={cart.totals.total_items} totals={cart.totals} />
            <MoneyLine label="Tax" value={cart.totals.total_tax} totals={cart.totals} />
            <MoneyLine label="Shipping" value={cart.totals.total_shipping} totals={cart.totals} />
            <div className="money-line money-line-total"><span>Total</span><strong>{formatMinorUnits(cart.totals.total_price, cart.totals.currency_code, cart.totals.currency_minor_unit, cart.totals.currency_symbol, cart.totals.currency_prefix, cart.totals.currency_suffix)}</strong></div>
            <Link className="button button-primary checkout-link" to="/checkout">Proceed to checkout <Icon name="arrow" size={17} /></Link>
            <p className="secure-note">Final amounts and availability are returned by WooCommerce.</p>
          </aside>
        </div>
      ) : null}
      {cart && !cart.items.length ? <div className="empty-state"><span className="empty-icon"><Icon name="bag" size={28} /></span><h2>Your cart is empty.</h2><p>Browse the NICKED collection to start a routine.</p><Link to="/shop" className="button button-primary">Shop all products</Link></div> : null}
    </div>
  );
}

const emptyAddress = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "IN",
  email: "",
  phone: ""
};

function CheckoutPage() {
  const { cart, isConnected } = useStorefront();
  const [billing, setBilling] = useState(emptyAddress);
  const [shipping, setShipping] = useState(emptyAddress);
  const [sameAddress, setSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const checkout = useQuery({
    queryKey: ["checkout-state"],
    queryFn: fetchCheckoutState,
    enabled: isConnected
  });
  const policiesQuery = useQuery({
    queryKey: ["policies"],
    queryFn: fetchPolicies,
    enabled: isConnected,
    staleTime: 60_000
  });
  const termsPublished = policiesQuery.data?.terms?.status === "published" && policiesQuery.data.terms.content !== "[OWNER TO CONFIRM]";
  const privacyPublished = policiesQuery.data?.privacy?.status === "published" && policiesQuery.data.privacy.content !== "[OWNER TO CONFIRM]";
  const policiesReady = termsPublished && privacyPublished;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const address = sameAddress ? billing : shipping;
    if (!/^\d{6}$/.test(address.postcode)) {
      setFormError("Enter a valid 6-digit PIN code.");
      return;
    }
    if (!/^\d{10}$/.test(billing.phone.replace(/\D/g, "").slice(-10))) {
      setFormError("Enter a valid 10-digit mobile number.");
      return;
    }
    if (!paymentMethod) {
      setFormError("Choose a payment method enabled in WooCommerce.");
      return;
    }
    setBusy(true);
    try {
      const response = await submitCheckout({
        billing_address: billing,
        shipping_address: sameAddress ? billing : shipping,
        payment_method: paymentMethod,
        payment_data: [],
        extensions: { nicked: { policy_consent: policyAccepted } }
      });
      const result = response.payment_result as { redirect_url?: string } | undefined;
      if (result?.redirect_url) {
        window.location.assign(result.redirect_url);
        return;
      }
      setFormError("WooCommerce received the checkout request. Payment status will appear only after the gateway confirms it.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "WooCommerce could not submit checkout.");
    } finally {
      setBusy(false);
    }
  }

  function updateAddress(setter: typeof setBilling, key: keyof typeof emptyAddress, value: string) {
    setter((current) => ({ ...current, [key]: value }));
  }

  const fields: Array<[keyof typeof emptyAddress, string, string, boolean?]> = [
    ["first_name", "First name", "text", true],
    ["last_name", "Last name", "text", true],
    ["email", "Email", "email", true],
    ["phone", "Mobile number", "tel", true],
    ["address_1", "Address", "text", true],
    ["address_2", "Apartment, suite, etc.", "text"],
    ["city", "City", "text", true],
    ["state", "State", "text", true],
    ["postcode", "6-digit PIN code", "text", true]
  ];

  return (
    <div className="page-wrap checkout-page">
      <div className="page-hero page-hero-short"><span className="eyebrow">Secure checkout</span><h1>Checkout</h1><p>WooCommerce calculates the final amount, tax, shipping and product availability.</p></div>
      {!isConnected ? <div className="connection-card"><span className="eyebrow">Staging setup</span><h2>Checkout is not enabled in this preview.</h2><p>Connect WooCommerce, configure the payment gateway and test its success, failure and pending flows before accepting orders.</p><Link to="/shop" className="button button-primary">Return to shop</Link></div> : null}
      {isConnected ? (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={submit}>
            <section className="checkout-section"><h2>Contact and billing</h2><div className="form-grid">{fields.map(([key, label, type, required]) => <label key={key} className={key === "address_1" || key === "address_2" ? "field-wide" : ""}>{label}<input type={type} value={billing[key]} required={Boolean(required)} inputMode={key === "phone" || key === "postcode" ? "numeric" : undefined} onChange={(event) => updateAddress(setBilling, key, event.target.value)} /></label>)}</div></section>
            <section className="checkout-section"><h2>Shipping address</h2><label className="check-row"><input type="checkbox" checked={sameAddress} onChange={(event) => setSameAddress(event.target.checked)} />Use billing address</label>{!sameAddress ? <div className="form-grid">{fields.filter(([key]) => key !== "email" && key !== "phone").map(([key, label, type, required]) => <label key={key} className={key === "address_1" || key === "address_2" ? "field-wide" : ""}>{label}<input type={type} value={shipping[key]} required={Boolean(required)} onChange={(event) => updateAddress(setShipping, key, event.target.value)} /></label>)}</div> : null}</section>
            <section className="checkout-section"><h2>Payment</h2>{checkout.isLoading ? <p>Loading WooCommerce payment methods…</p> : checkout.error ? <p className="inline-alert">Could not load payment methods: {checkout.error.message}</p> : checkout.data?.payment_methods.length ? checkout.data.payment_methods.map((method) => <label key={method} className="payment-option"><input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />{method}</label>) : <p className="owner-confirm-note">Payment options will appear here after the owner configures the WooCommerce gateway.</p>}</section>
            {!policiesReady ? <div className="owner-confirm-note">Checkout stays disabled until the owner publishes the terms and privacy policies. <Link to="/policies/terms">Review terms</Link> · <Link to="/policies/privacy">Review privacy</Link></div> : <label className="check-row policy-consent"><input type="checkbox" required checked={policyAccepted} onChange={(event) => setPolicyAccepted(event.target.checked)} />I accept the <Link to="/policies/terms">store terms</Link> and <Link to="/policies/privacy">privacy policy</Link>.</label>}
            {formError ? <p className="inline-alert" role="alert">{formError}</p> : null}
            <button type="submit" className="button button-primary checkout-submit" disabled={busy || checkout.isLoading || !checkout.data?.payment_methods.length || !policiesReady || !policyAccepted}>{busy ? "Sending to WooCommerce…" : "Place order"}</button>
            <p className="secure-note">An order is not marked paid by reaching a confirmation page. The WooCommerce payment gateway and verified webhook must confirm it.</p>
          </form>
          <aside className="order-summary checkout-summary"><h2>Your order</h2>{cart?.items.map((item) => <div className="checkout-item" key={item.key}><span>{item.name} × {item.quantity}</span><strong>{formatMinorUnits(item.totals.line_total, item.prices.currency_code, item.prices.currency_minor_unit, item.prices.currency_symbol, item.prices.currency_prefix, item.prices.currency_suffix)}</strong></div>)}{cart?.items.length ? <><MoneyLine label="Tax" value={cart.totals.total_tax} totals={cart.totals} /><MoneyLine label="Shipping" value={cart.totals.total_shipping} totals={cart.totals} /><div className="money-line money-line-total"><span>Total</span><strong>{formatMinorUnits(cart.totals.total_price, cart.totals.currency_code, cart.totals.currency_minor_unit, cart.totals.currency_symbol, cart.totals.currency_prefix, cart.totals.currency_suffix)}</strong></div></> : <p className="muted">Your WooCommerce cart will appear here.</p>}</aside>
        </div>
      ) : null}
    </div>
  );
}

function TrackPage() {
  const [order, setOrder] = useState("");
  const [verification, setVerification] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof requestTracking>> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await requestTracking(order.trim(), verification.trim()));
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "We could not verify this order.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-wrap track-page">
      <div className="page-hero page-hero-short"><span className="eyebrow">Order support</span><h1>Track your order</h1><p>Enter your order number and the billing email or phone number to see verified status.</p></div>
      <form className="track-form" onSubmit={submit}>
        <label>Order number<input value={order} onChange={(event) => setOrder(event.target.value)} required /></label>
        <label>Billing email or phone<input value={verification} onChange={(event) => setVerification(event.target.value)} required autoComplete="off" /></label>
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Checking…" : "Check status"}</button>
        {!commerceConnected ? <p className="owner-confirm-note">Order tracking is enabled when the private WooCommerce verification endpoint is configured.</p> : null}
        {error ? <p className="inline-alert" role="alert">{error}</p> : null}
      </form>
      {result ? <section className="tracking-result" aria-live="polite"><span className="eyebrow">Verified order status</span><h2>{result.status}</h2>{result.courier ? <p>{result.courier}</p> : null}<ol>{result.timeline.map((step, index) => <li className={step.complete ? "is-complete" : ""} key={index}><span className="timeline-dot" /><div><strong>{step.label}</strong>{step.date ? <time>{step.date}</time> : null}</div></li>)}</ol>{result.tracking_url ? <a className="button button-outline" href={result.tracking_url} target="_blank" rel="noreferrer">Open carrier tracking <Icon name="arrow" size={17} /></a> : <p className="muted">No carrier tracking link is attached to this order yet.</p>}</section> : null}
    </div>
  );
}

function AccountPage() {
  const base = getWordPressBase();
  const accountUrl = base ? base + "/my-account/" : "";
  return (
    <div className="page-wrap">
      <div className="page-hero page-hero-short"><span className="eyebrow">Your account</span><h1>Welcome back</h1><p>Sign in to review your WooCommerce orders, saved addresses and subscription settings.</p></div>
      <div className="account-card"><span className="account-mark"><Icon name="user" size={26} /></span><h2>Manage your NICKED account</h2><p>Account sessions and password resets are handled by WordPress and WooCommerce. The staging host must be connected before sign-in is available.</p>{accountUrl ? <a className="button button-primary" href={accountUrl}>Open account sign-in <Icon name="arrow" size={17} /></a> : <span className="owner-confirm-note">Account sign-in will be linked after the WordPress staging URL is set.</span>}</div>
    </div>
  );
}

function SupportPage() {
  const settings = useQuery({
    queryKey: ["public-settings"],
    queryFn: fetchPublicSettings,
    enabled: commerceConnected
  });
  const data = settings.data;
  const whatsapp = data?.whatsapp_number ? "https://wa.me/" + data.whatsapp_number.replace(/\D/g, "") + "?text=Hi%20NICKED%2C%20I%20need%20assistance%20with%20a%20product%20or%20order." : "";
  return (
    <div className="page-wrap support-page">
      <div className="page-hero page-hero-short"><span className="eyebrow">Customer support</span><h1>How can we help?</h1><p>Call or WhatsApp details will be added by the owner in the WordPress settings screen.</p></div>
      <div className="support-card-grid">
        {data?.support_phone ? <a className="support-card" href={"tel:" + data.support_phone}><Icon name="phone" size={25} /><span className="eyebrow">Call us</span><h2>{data.support_phone}</h2><span>Call NICKED support</span></a> : <div className="support-card"><Icon name="phone" size={25} /><span className="eyebrow">Call us</span><h2>Number to be confirmed</h2><span>Owner to add the support phone.</span></div>}
        {whatsapp ? <a className="support-card" href={whatsapp} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={25} /><span className="eyebrow">WhatsApp</span><h2>Chat with NICKED</h2><span>Hi NICKED, I need assistance with a product or order.</span></a> : <div className="support-card"><Icon name="whatsapp" size={25} /><span className="eyebrow">WhatsApp</span><h2>Number to be confirmed</h2><span>Owner to add the WhatsApp number.</span></div>}
        {data?.support_email ? <a className="support-card" href={"mailto:" + data.support_email}><span className="eyebrow">Email</span><h2>{data.support_email}</h2><span>Write to NICKED support</span></a> : <div className="support-card"><span className="eyebrow">Email</span><h2>Email to be confirmed</h2><span>Owner to add the support email.</span></div>}
      </div>
      <div className="support-bottom-links"><Link to="/track" className="button button-primary">Track an order</Link><Link to="/policies/returns" className="button button-outline">Return & refund information</Link></div>
    </div>
  );
}

const policyTitles: Record<string, string> = {
  shipping: "Shipping",
  returns: "Returns & refunds",
  cancellation: "Cancellation",
  privacy: "Privacy",
  terms: "Terms",
  faq: "Frequently asked questions"
};

function PolicyPage() {
  const { slug = "shipping" } = useParams();
  const policiesQuery = useQuery({
    queryKey: ["policies"],
    queryFn: fetchPolicies,
    enabled: commerceConnected
  });
  const policy: PublicPolicy | undefined = policiesQuery.data?.[slug];
  const title = policy?.title || policyTitles[slug] || "Store information";
  const text = policy?.content || "[OWNER TO CONFIRM]";
  return (
    <div className="page-wrap policy-page">
      <div className="page-hero page-hero-short"><span className="eyebrow">Store information</span><h1>{title}</h1><p>Editable in WordPress. Unconfirmed details are kept in draft.</p></div>
      <article className="policy-card">
        {!commerceConnected || text === "[OWNER TO CONFIRM]" ? <span className="owner-badge">Owner to confirm</span> : null}
        <div className="policy-content">{text.split("\n").filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      </article>
      <div className="policy-nav">{Object.entries(policyTitles).map(([key, label]) => <Link key={key} to={"/policies/" + key}>{label}</Link>)}</div>
    </div>
  );
}

function RoutinesAndSupportFallback() {
  return <NavigateToShop />;
}

function NavigateToShop() {
  return <div className="page-wrap empty-state"><h1>That page is not available.</h1><Link to="/shop" className="button button-primary">Browse products</Link></div>;
}

function NotFoundPage() {
  return <div className="page-wrap empty-state"><span className="eyebrow">404</span><h1>We couldn't find that page.</h1><p>Try browsing the NICKED collection.</p><Link to="/shop" className="button button-primary">Shop all products</Link></div>;
}

function App() {
  useEffect(() => {
    document.title = "NICKED Professional Hair Care";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", "Purpose-Driven Care for Better Hair.");
  }, []);
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<CatalogPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/routines" element={<RoutinesPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/policies/:slug" element={<PolicyPage />} />
        <Route path="/order-confirmation" element={<div className="page-wrap empty-state"><span className="eyebrow">Order update</span><h1>Check your order status</h1><p>Payment status and fulfilment updates come from WooCommerce after the gateway confirms them.</p><Link to="/track" className="button button-primary">Track your order</Link></div>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
