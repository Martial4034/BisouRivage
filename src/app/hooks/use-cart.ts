import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useEffect } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  format: string;
  quantity: number;
  stock: number;
  artisteName: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void; // Fonction pour mettre à jour la quantité
  clearCart: () => void;
  loadCart: () => void; // Fonction pour charger le panier depuis localStorage
}

export const useCart = create<CartState>()(
  immer((set) => ({
    items: [],

    addItem: (item: CartItem) =>
      set((state) => {
        const existingItem = state.items.find((i) => i.id === item.id && i.format === item.format);
        if (existingItem) {
          existingItem.quantity += item.quantity; // Ajouter à la quantité existante
        } else {
          state.items.push(item);
        }
        localStorage.setItem('cart', JSON.stringify(state.items)); // Sauvegarder dans le localStorage
      }),

    removeItem: (id: string) =>
      set((state) => {
        state.items = state.items.filter((item) => item.id !== id);
        localStorage.setItem('cart', JSON.stringify(state.items)); // Sauvegarder dans le localStorage
      }),

    updateQuantity: (id: string, quantity: number) =>
      set((state) => {
        const item = state.items.find((item) => item.id === id);
        if (item) {
          item.quantity = quantity;
        }
        localStorage.setItem('cart', JSON.stringify(state.items)); // Sauvegarder dans le localStorage
      }),

    clearCart: () =>
      set((state) => {
        state.items = [];
        localStorage.setItem('cart', JSON.stringify(state.items)); // Sauvegarder dans le localStorage
      }),

    loadCart: () => {
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        set((state) => {
          state.items = JSON.parse(cartData);
        });
      }
    },
  }))
);

// Hook pour charger le panier depuis localStorage à chaque fois que le composant est monté
export const useInitializeCart = () => {
  const loadCart = useCart((state) => state.loadCart);

  useEffect(() => {
    loadCart(); // Charger les items du panier au montage
  }, [loadCart]);
};
