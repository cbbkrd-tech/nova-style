import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import medusa from '../lib/medusa';

const CART_ID_KEY = 'medusa_cart_id';

function getStoredCartId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_ID_KEY);
}

function setStoredCartId(cartId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CART_ID_KEY, cartId);
  }
}

export function useCart() {
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const cartId = getStoredCartId();

      if (cartId) {
        try {
          const { cart } = await medusa.store.cart.retrieve(cartId);
          return cart;
        } catch {
          // Cart not found, create new one
        }
      }

      // Create new cart
      const { cart } = await medusa.store.cart.create({});
      if (cart?.id) {
        setStoredCartId(cart.id);
      }
      return cart;
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ variantId, quantity }: { variantId: string; quantity: number }) => {
      const cartId = getStoredCartId();
      if (!cartId) throw new Error('No cart found');

      const { cart } = await medusa.store.cart.createLineItem(cartId, {
        variant_id: variantId,
        quantity,
      });
      return cart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ lineId, quantity }: { lineId: string; quantity: number }) => {
      const cartId = getStoredCartId();
      if (!cartId) throw new Error('No cart found');

      const { cart } = await medusa.store.cart.updateLineItem(cartId, lineId, {
        quantity,
      });
      return cart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (lineId: string) => {
      const cartId = getStoredCartId();
      if (!cartId) throw new Error('No cart found');

      const { cart } = await medusa.store.cart.deleteLineItem(cartId, lineId);
      return cart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return {
    cart: cartQuery.data,
    isLoading: cartQuery.isLoading,
    addItem: addItemMutation.mutate,
    updateItem: updateItemMutation.mutate,
    removeItem: removeItemMutation.mutate,
    isAdding: addItemMutation.isPending,
    isUpdating: updateItemMutation.isPending,
    isRemoving: removeItemMutation.isPending,
  };
}
