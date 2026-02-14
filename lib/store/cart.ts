import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
    id: string
    nombre: string
    precio: number
    cantidad: number
    imagen_url?: string
    unidad_medida: 'bulto' | 'granel'
}

interface CartStore {
    items: CartItem[]
    addItem: (product: Omit<CartItem, 'cantidad'>, cantidad?: number) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, cantidad: number) => void
    clearCart: () => void
    getTotal: () => number
    getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product, cantidad = 1) => {
                set((state) => {
                    const existingItem = state.items.find((item) => item.id === product.id)

                    if (existingItem) {
                        return {
                            items: state.items.map((item) =>
                                item.id === product.id
                                    ? { ...item, cantidad: item.cantidad + cantidad }
                                    : item
                            ),
                        }
                    }

                    return {
                        items: [...state.items, { ...product, cantidad }],
                    }
                })
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== productId),
                }))
            },

            updateQuantity: (productId, cantidad) => {
                if (cantidad <= 0) {
                    get().removeItem(productId)
                    return
                }

                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === productId ? { ...item, cantidad } : item
                    ),
                }))
            },

            clearCart: () => {
                set({ items: [] })
            },

            getTotal: () => {
                return get().items.reduce((total, item) => total + item.precio * item.cantidad, 0)
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.cantidad, 0)
            },
        }),
        {
            name: 'cart-storage',
        }
    )
)
