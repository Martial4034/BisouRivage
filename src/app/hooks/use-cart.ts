import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

interface CartItem {
  id: string;           // ID du produit
  size: string;         // Taille sélectionnée
  frameOption: "avec" | "sans";
  frameColor?: string;  // Couleur du cadre si frameOption === "avec"
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isInitialized: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, size: string, frameColor?: string) => void;
  clearCart: () => void;
  initializeCart: () => void;
  updateQuantity: (id: string, size: string, frameColor: string | undefined, quantity: number) => void;
}

export const useCart = create(
  persist<CartStore>(
    (set) => ({
      items: [],
      isInitialized: false,
      addItem: (item) => 
        set((state) => {
          const existingItem = state.items.find(
            i => i.id === item.id && 
                i.size === item.size && 
                i.frameOption === item.frameOption &&
                i.frameColor === item.frameColor
          );

          if (existingItem) {
            return {
              ...state,
              items: state.items.map((i) =>
                i.id === item.id && 
                i.size === item.size && 
                i.frameOption === item.frameOption &&
                i.frameColor === item.frameColor
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }

          return { 
            ...state,
            items: [...state.items, { ...item, quantity: 1 }] 
          };
        }),
      removeItem: (id, size, frameColor) =>
        set((state) => ({
          ...state,
          items: state.items.filter(
            i => !(i.id === id && i.size === size && i.frameColor === frameColor)
          ),
        })),
      clearCart: () => set((state) => ({ ...state, items: [] })),
      initializeCart: () => set((state) => ({ ...state, isInitialized: true })),
      updateQuantity: (id, size, frameColor, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id &&
            item.size === size &&
            item.frameColor === frameColor
              ? { ...item, quantity }
              : item
          ),
        })),
    }),
    {
      name: 'cart-storage',
    }
  )
);

// Hook pour initialiser le panier
export const useInitializeCart = () => {
  const { initializeCart, isInitialized } = useCart();

  useEffect(() => {
    if (!isInitialized) {
      console.log("🛒 Initialisation du panier...");
      initializeCart();
      console.log("🛒 Initialisation du panier terminée", initializeCart);
    }
  }, [initializeCart, isInitialized]);

  return useCart((state) => state.items);
};