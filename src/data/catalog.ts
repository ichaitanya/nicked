export type StoreProduct = {
  id: string;
  wooId?: number;
  name: string;
  size: string;
  range: string;
  type: string;
  concern: string;
  categories: string[];
  price: number;
  priceText?: string;
  priceLabel?: "Printed MRP" | "WooCommerce";
  image: string;
  alt: string;
  tagline: string;
  summary?: string;
  keyPoints: string[];
  idealFor?: string;
  howToUse?: string;
  ingredients?: string;
  inStock?: boolean;
  purchasable?: boolean;
  isPreview: boolean;
  tint: string;
};

export const categoryLabels = [
  "Shampoos",
  "Conditioners",
  "Serums & Leave-Ins",
  "Heat & Styling Protection",
  "Scalp & Oil Care",
  "Post-Treatment Care"
];

export const concernLabels = [
  "Smoothness & Frizz Control",
  "Hydration & Nourishment",
  "Scalp & Oil Care",
  "Post-Treatment Care",
  "Styling & Heat Protection"
];

export const rangeLabels = [
  "Argan Oil",
  "Marula Oil",
  "Tea Tree",
  "Post-Treatment",
  "Styling & Protection"
];

export const demoProducts: StoreProduct[] = [
  {
    id: "nicked-post-treatment-shampoo",
    name: "NICKED Post-Treatment Shampoo",
    size: "300 ml",
    range: "Post-Treatment",
    type: "Shampoo",
    concern: "Chemically treated / sensitized hair",
    categories: ["Shampoos", "Post-Treatment Care"],
    price: 1150,
    priceLabel: "Printed MRP",
    image: "/assets/post-treatment-shampoo.webp",
    alt: "NICKED Post-Treatment Shampoo bottle from the supplied catalogue",
    tagline: "For long-lasting smoothness & shine",
    keyPoints: [
      "Gentle Cleansing Formula",
      "Helps Maintain Moisture Balance",
      "Provides Deep Nourishment",
      "Supports Long-Lasting Smoothness",
      "Keeps Hair Soft, Manageable & Frizz-Free"
    ],
    idealFor: "Chemically treated, straightened, smoothened and sensitized hair that needs gentle cleansing, deep nourishment and long-lasting smoothness.",
    ingredients: "Aqua (Water), Sodium Lauroyl Sarcosinate, Cocamidopropyl Betaine, Ammonium Lauryl Sulfate, Cocamide DEA, Polyquaternium-10, Hydrolyzed Keratin, Perfume, Citric Acid, Phenoxyethanol.",
    isPreview: true,
    tint: "#E4E0F7"
  },
  {
    id: "nicked-post-treatment-conditioner",
    name: "NICKED Post-Treatment Conditioner",
    size: "300 ml",
    range: "Post-Treatment",
    type: "Conditioner",
    concern: "Chemically treated / sensitized hair",
    categories: ["Conditioners", "Post-Treatment Care"],
    price: 1150,
    priceLabel: "Printed MRP",
    image: "/assets/post-treatment-conditioner.webp",
    alt: "NICKED Post-Treatment Conditioner bottle from the supplied catalogue",
    tagline: "For long-lasting smoothness & hydration",
    summary: "NICKED Post-Treatment Conditioner is a deep-conditioning formula designed for chemically treated and sensitized hair. This rich, nourishing formula helps maintain hair's natural moisture balance while providing long-lasting smoothness and hydration. It strengthens the hair, enhances shine, reduces frizz and improves manageability, leaving hair feeling soft, silky, and healthy.",
    keyPoints: [
      "Deeply Nourishes & Hydrates",
      "Smoothens & Softens Hair",
      "Helps Improve Manageability",
      "Enhances Shine & Frizz Control",
      "Keeps Hair Healthy & Strong"
    ],
    idealFor: "Chemically treated, straightened, smoothened and sensitized hair that needs deep nourishment, hydration and long-lasting smoothness.",
    howToUse: "After shampooing with NICKED Post-Treatment Shampoo, apply evenly to damp hair. Leave on for 2–3 minutes for daily use or 5–7 minutes for deep conditioning. Rinse thoroughly with lukewarm water.",
    ingredients: "Aqua (Water), Cetearyl Alcohol, Stearimonium Chloride, Amodimethicone and Trideceth-12, Cetrimonium Chloride, Cyclopentasiloxane and Dimethicone, Hydroxyethylcellulose, Perfume, Hydrolyzed Keratin, Citric Acid, Phenoxyethanol.",
    isPreview: true,
    tint: "#E4E0F7"
  },
  {
    id: "nicked-marula-oil-hydration-shampoo",
    name: "NICKED Marula Oil Hydration Shampoo",
    size: "300 ml",
    range: "Marula Oil",
    type: "Shampoo",
    concern: "Hydration / nourishment",
    categories: ["Shampoos", "Scalp & Oil Care"],
    price: 1150,
    priceLabel: "Printed MRP",
    image: "/assets/marula-hydration-shampoo.webp",
    alt: "NICKED Marula Oil Hydration Shampoo bottle from the supplied catalogue",
    tagline: "Hydrate | Nourish | Shine",
    keyPoints: [
      "Gentle Cleansing Formula",
      "Helps Maintain Moisture Balance",
      "Provides Deep Nourishment",
      "Supports Long-Lasting Smoothness",
      "Keeps Hair Soft, Manageable & Frizz-Free"
    ],
    idealFor: "Chemically treated, straightened, smoothened and sensitized hair that needs gentle cleansing, deep nourishment and long-lasting smoothness.",
    howToUse: "Wet hair, apply shampoo and gently massage into hair and scalp. Rinse thoroughly. Follow with Marula Oil Transforming Conditioner.",
    ingredients: "Water (Aqua), Sodium C14-16 Olefin Sulfonate, Cocamidopropyl Betaine, Cocamide MEA, Sclerocarya Birrea Seed Oil (Marula Oil), Chenopodium Quinoa Seed Extract, Polyglyceryl-10 Oleate, Polysorbate 20, Sodium Chloride, Perfume, PEG-7 Glyceryl Cocoate, Sodium Lauroyl Sarcosinate, Polyquaternium-10, Tetrasodium EDTA, Polyquaternium-7, Citric Acid, Butylene Glycol, Phenoxyethanol.",
    isPreview: true,
    tint: "#F6E6C8"
  },
  {
    id: "nicked-marula-oil-transforming-conditioner",
    name: "NICKED Marula Oil Transforming Conditioner",
    size: "300 ml",
    range: "Marula Oil",
    type: "Conditioner",
    concern: "Hydration / nourishment",
    categories: ["Conditioners", "Scalp & Oil Care"],
    price: 1150,
    priceLabel: "Printed MRP",
    image: "/assets/marula-transforming-conditioner.webp",
    alt: "NICKED Marula Oil Transforming Conditioner bottle from the supplied catalogue",
    tagline: "Hydrate | Nourish | Shine",
    summary: "NICKED Marula Oil Transforming Conditioner is a rich yet lightweight formula designed for chemically treated and sensitized hair. Infused with precious Marula Oil, it replenishes moisture, enhances shine, and improves hair's strength while keeping it soft, silky, smooth, and manageable. It detangles effortlessly, reduces frizz, and leaves hair looking healthy, glossy, and radiant.",
    keyPoints: [
      "Deep Nourishment & Hydration",
      "Locks in moisture for soft, silky hair",
      "Enhances manageability and shine",
      "Frizz control & smoothness",
      "Protects and prolongs treatment results",
      "Gentle on treated hair"
    ],
    idealFor: "Chemically treated, straightened, smoothened and sensitized hair that needs deep nourishment, hydration and long-lasting smoothness.",
    howToUse: "After shampooing with Marula Oil Hydration Shampoo, apply the conditioner evenly to damp hair. Leave on for 2–3 minutes for daily hydration or up to 5 minutes for deep conditioning. Rinse thoroughly with lukewarm water.",
    ingredients: "Aqua (Water), Cetearyl Alcohol, Dimethicone, Stearimonium Chloride, Hydrolyzed Wheat Protein, Marula Oil (Marula Seed Oil), Chenopodium Quinoa Seed Extract, Hydrolyzed Corn Protein, Hydrolyzed Soy Protein, Butylene Glycol, Phenoxyethanol.",
    isPreview: true,
    tint: "#F6E6C8"
  },
  {
    id: "nicked-tea-tree-rejuvenating-shampoo",
    name: "NICKED Tea Tree Rejuvenating Shampoo",
    size: "300 ml",
    range: "Tea Tree",
    type: "Shampoo",
    concern: "Dandruff / oily scalp / scalp irritation",
    categories: ["Shampoos", "Scalp & Oil Care"],
    price: 1150,
    priceLabel: "Printed MRP",
    image: "/assets/tea-tree-shampoo.webp",
    alt: "NICKED Tea Tree Rejuvenating Shampoo bottle from the supplied catalogue",
    tagline: "Purifies scalp | Controls oil | Promotes healthy hair",
    keyPoints: [
      "Deeply cleanses scalp and hair",
      "Removes dirt, excess oil and impurities",
      "Helps reduce dandruff, flakiness and scalp irritation",
      "Maintains scalp's natural moisture balance",
      "Leaves hair clean, soft and refreshed",
      "Suitable for daily use and all hair types"
    ],
    idealFor: "Oily scalp, dandruff-prone scalp, itchy scalp and hair that needs a deep yet gentle cleanse. Suitable for all hair types.",
    howToUse: "Wet hair, apply shampoo and gently massage into hair and scalp. Rinse thoroughly. For best results, follow with NICKED Tea Tree Conditioner.",
    isPreview: true,
    tint: "#DDE8CF"
  },
  {
    id: "nicked-tea-tree-rejuvenating-conditioner",
    name: "NICKED Tea Tree Rejuvenating Conditioner",
    size: "300 ml",
    range: "Tea Tree",
    type: "Conditioner",
    concern: "Dandruff / scalp irritation / dryness / nourishment",
    categories: ["Conditioners", "Scalp & Oil Care"],
    price: 1150,
    priceLabel: "Printed MRP",
    image: "/assets/tea-tree-conditioner.webp",
    alt: "NICKED Tea Tree Rejuvenating Conditioner bottle from the supplied catalogue",
    tagline: "Smooths hair | Reduces frizz | Deep nourishment",
    keyPoints: [
      "Nourishing and refreshing hair treatment",
      "Soothes the scalp",
      "Helps reduce dryness, irritation and dandruff",
      "Hydrates hair strands without weighing them down",
      "Promotes a balanced, healthy scalp environment",
      "Leaves hair soft, manageable and revitalized"
    ],
    idealFor: "Oily, flaky, or sensitive scalp. Helps control dandruff and scalp irritation while nourishing and hydrating hair. Suitable for all hair types.",
    howToUse: "After shampooing, apply Tea Tree Rejuvenating Conditioner to hair. Let it sit for 2–3 minutes for therapeutic benefits to absorb and rinse thoroughly.",
    isPreview: true,
    tint: "#DDE8CF"
  },
  {
    id: "nicked-marula-oil-hair-healing-repair-serum",
    name: "NICKED Marula Oil Hair Healing & Repair Serum",
    size: "100 ml",
    range: "Marula Oil",
    type: "Hair Serum",
    concern: "Frizz / dryness / shine / repair",
    categories: ["Serums & Leave-Ins", "Scalp & Oil Care"],
    price: 1450,
    priceLabel: "Printed MRP",
    image: "/assets/marula-repair-serum.webp",
    alt: "NICKED Marula Oil Hair Healing and Repair Serum bottle from the supplied catalogue",
    tagline: "Nourish | Smooth | Repair | Protect",
    summary: "NICKED Marula Oil Hair Healing & Repair Serum is a premium smoothing treatment designed for all hair types. Enriched with Marula Oil, Aloe Vera, and Vitamin E, it effortlessly tames frizz and flyaway, making styling with flat irons and curling irons easy. This serum deeply moisturizes, leaving your hair soft, nourished, and manageable. Regular use promotes a silky, healthy, and refreshed appearance.",
    keyPoints: [
      "Instantly adds natural shine",
      "Reduces frizz and flyaways",
      "Nourishes and smooths hair",
      "Helps in easy styling with flat and curling irons",
      "Lightweight, non-greasy formula",
      "Suitable for all hair types"
    ],
    idealFor: "Dry, frizzy, dull or damaged hair. Perfect for all hair types, including straight, wavy, curly and chemically treated hair.",
    howToUse: "Dispense 1–2 pumps into your palm and apply to damp or dry hair before styling for optimal results.",
    ingredients: "Sclerocarya Birrea (Marula) Seed Oil, Cyclomethicone, Dimethicone, Tocopheryl Acetate (Vitamin E), Aloe Vera Extract.",
    isPreview: true,
    tint: "#F6E6C8"
  },
  {
    id: "nicked-argan-oil-moisturizing-leave-in-spray",
    name: "NICKED Argan Oil Moisturizing Leave-In Spray",
    size: "150 ml",
    range: "Argan Oil",
    type: "Leave-In Spray",
    concern: "Frizz / dryness / detangling / shine",
    categories: ["Serums & Leave-Ins"],
    price: 750,
    priceLabel: "Printed MRP",
    image: "/assets/argan-leave-in-spray.webp",
    alt: "NICKED Argan Oil Moisturizing Leave-In Spray bottle from the supplied catalogue",
    tagline: "Detangle | Anti-Frizz | Shine | Smoothness | Strengthen",
    summary: "NICKED Argan Oil Moisturizing Leave-In Spray is enriched with the goodness of pure Argan Oil. This lightweight, non-greasy formula instantly detangles, controls frizz and flyaways, adds natural shine, and leaves hair soft, smooth and manageable. It also helps protect and strengthen hair, making it look healthier and more vibrant — every day.",
    keyPoints: [
      "Instantly detangles hair",
      "Controls frizz and flyaways",
      "Adds natural shine and smoothness",
      "Lightweight, non-greasy formula",
      "Helps protect and strengthen hair",
      "Suitable for all hair types"
    ],
    idealFor: "Dry, frizzy, tangled or dull hair. Perfect for all hair types, including straight, wavy, curly and coily hair.",
    howToUse: "Spray evenly onto damp or dry hair. Do not rinse. Style as desired.",
    isPreview: true,
    tint: "#E7EBF2"
  },
  {
    id: "nicked-heat-protection-spray",
    name: "NICKED Heat Protection Spray",
    size: "150 ml",
    range: "Styling & Protection",
    type: "Heat Protection Spray",
    concern: "Heat damage / UV damage / frizz / smoothness / shine",
    categories: ["Heat & Styling Protection"],
    price: 690,
    priceLabel: "Printed MRP",
    image: "/assets/heat-protection-spray.webp",
    alt: "NICKED Heat Protection Spray bottle from the supplied catalogue",
    tagline: "Protect | Shine | Smooth | Prevent damage",
    keyPoints: [
      "Enhances shine and smoothness",
      "Keeps hair soft, manageable and frizz-free",
      "Suitable for all hair types"
    ],
    howToUse: "Spray evenly on damp or dry hair before using a flat iron, curling iron or blow-dryer. Ensure even distribution to maximize protection and shine.",
    isPreview: true,
    tint: "#EADBCB"
  }
];

export const routineSets = [
  {
    name: "Smooth & Nourish",
    productIds: [
      "nicked-post-treatment-shampoo",
      "nicked-post-treatment-conditioner"
    ]
  },
  {
    name: "Hydration & Care",
    productIds: [
      "nicked-marula-oil-hydration-shampoo",
      "nicked-marula-oil-transforming-conditioner"
    ]
  },
  {
    name: "Scalp Care",
    productIds: [
      "nicked-tea-tree-rejuvenating-shampoo",
      "nicked-tea-tree-rejuvenating-conditioner"
    ]
  },
  {
    name: "Style & Protect",
    productIds: [
      "nicked-marula-oil-hair-healing-repair-serum",
      "nicked-argan-oil-moisturizing-leave-in-spray",
      "nicked-heat-protection-spray"
    ]
  }
];
