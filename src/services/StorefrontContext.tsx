import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCartItem,
  applyCoupon,
  commerceConnected,
  fetchCart,
  fetchCatalogue,
  removeCartItem,
  updateCartItem,
  type StoreCart
} from "./woocommerce";
import type { StoreProduct } from "../data/catalog";

type StorefrontContextValue = {
  products: StoreProduct[];
  loading: boolean;
  catalogueError: string | null;
  cart: StoreCart | undefined;
  cartLoading: boolean;
  cartError: string | null;
  isConnected: boolean;
  notice: string | null;
  clearNotice: () => void;
  addToCart: (product: StoreProduct, quantity?: number) => Promise<void>;
  addRoutine: (products: StoreProduct[]) => Promise<void>;
  setQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  coupon: (code: string) => Promise<void>;
  favourites: string[];
  toggleFavourite: (productId: string) => void;
};

const StorefrontContext = createContext<StorefrontContextValue | null>(null);

function getSavedFavourites(): string[] {
  try {
    const saved = window.localStorage.getItem("nicked-favourites");
    return saved ? JSON.parse(saved) as string[] : [];
  } catch {
    return [];
  }
}

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<string[]>(getSavedFavourites);
  const catalogueQuery = useQuery({
    queryKey: ["catalogue"],
    queryFn: fetchCatalogue
  });
  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: commerceConnected
  });

  const addMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => addCartItem(id, quantity),
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart)
  });
  const updateMutation = useMutation({
    mutationFn: ({ key, quantity }: { key: string; quantity: number }) => updateCartItem(key, quantity),
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart)
  });
  const removeMutation = useMutation({
    mutationFn: (key: string) => removeCartItem(key),
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart)
  });
  const couponMutation = useMutation({
    mutationFn: (code: string) => applyCoupon(code),
    onSuccess: (cart) => queryClient.setQueryData(["cart"], cart)
  });

  const addToCart = useCallback(async (product: StoreProduct, quantity = 1) => {
    if (!commerceConnected || !product.wooId) {
      setNotice("Cart and checkout activate after the WooCommerce staging connection is configured. No local total has been estimated.");
      return;
    }
    if (product.purchasable === false || product.inStock === false) {
      setNotice("WooCommerce currently marks this product as unavailable.");
      return;
    }
    try {
      await addMutation.mutateAsync({ id: product.wooId, quantity });
      setNotice(product.name + " added to your WooCommerce cart.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "WooCommerce could not add this product.");
    }
  }, [addMutation]);

  const addRoutine = useCallback(async (routineProducts: StoreProduct[]) => {
    if (!commerceConnected || routineProducts.some((product) => !product.wooId)) {
      setNotice("Routine totals and cart actions come from WooCommerce; connect the staging store to add this routine.");
      return;
    }
    try {
      let cart = queryClient.getQueryData<StoreCart>(["cart"]);
      for (const product of routineProducts) {
        if (product.wooId) cart = await addCartItem(product.wooId, 1);
      }
      if (cart) queryClient.setQueryData(["cart"], cart);
      setNotice("Routine products added. WooCommerce has calculated the cart.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "WooCommerce could not add this routine.");
    }
  }, [queryClient]);

  const setQuantity = useCallback((key: string, quantity: number) => {
    if (!commerceConnected) {
      setNotice("Connect WooCommerce to change cart quantities.");
      return;
    }
    if (quantity < 1) {
      void removeMutation.mutateAsync(key).catch((error: unknown) => {
        setNotice(error instanceof Error ? error.message : "WooCommerce could not update the cart.");
      });
      return;
    }
    void updateMutation.mutateAsync({ key, quantity }).catch((error: unknown) => {
      setNotice(error instanceof Error ? error.message : "WooCommerce could not update the cart.");
    });
  }, [removeMutation, updateMutation]);

  const removeFromCart = useCallback((key: string) => {
    void removeMutation.mutateAsync(key).catch((error: unknown) => {
      setNotice(error instanceof Error ? error.message : "WooCommerce could not remove the item.");
    });
  }, [removeMutation]);

  const coupon = useCallback(async (code: string) => {
    if (!commerceConnected) {
      setNotice("Coupons are managed by WooCommerce and are unavailable in the local preview.");
      return;
    }
    await couponMutation.mutateAsync(code);
  }, [couponMutation]);

  const toggleFavourite = useCallback((productId: string) => {
    setFavourites((current) => {
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      window.localStorage.setItem("nicked-favourites", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<StorefrontContextValue>(() => ({
    products: catalogueQuery.data || [],
    loading: catalogueQuery.isLoading,
    catalogueError: catalogueQuery.error instanceof Error ? catalogueQuery.error.message : null,
    cart: cartQuery.data,
    cartLoading: cartQuery.isLoading,
    cartError: cartQuery.error instanceof Error ? cartQuery.error.message : null,
    isConnected: commerceConnected,
    notice,
    clearNotice: () => setNotice(null),
    addToCart,
    addRoutine,
    setQuantity,
    removeFromCart,
    coupon,
    favourites,
    toggleFavourite
  }), [catalogueQuery.data, catalogueQuery.isLoading, catalogueQuery.error, cartQuery.data, cartQuery.isLoading, cartQuery.error, notice, addToCart, addRoutine, setQuantity, removeFromCart, coupon, favourites, toggleFavourite]);

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>;
}

export function useStorefront(): StorefrontContextValue {
  const value = useContext(StorefrontContext);
  if (!value) throw new Error("useStorefront must be used inside StorefrontProvider.");
  return value;
}
