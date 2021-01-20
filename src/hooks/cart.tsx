import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import api from '../services/api';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const savedProducts = await AsyncStorage.getItem('@GoStack:products');

      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      let isProductSaved = false;

      const changedProduct = products.map(savedProduct => {
        if (savedProduct.id === product.id) {
          isProductSaved = true;

          return {
            ...savedProduct,
            quantity: savedProduct.quantity + 1,
          };
        }

        return savedProduct;
      });

      if (!isProductSaved) {
        setProducts([...changedProduct, { ...product, quantity: 0 }]);
        return;
      }

      setProducts(changedProduct);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const changedProduct = products.map(savedProduct => {
        if (savedProduct.id === id) {
          return {
            ...savedProduct,
            quantity: savedProduct.quantity + 1,
          };
        }

        return savedProduct;
      });

      setProducts(changedProduct);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let isQuantityZeroAndIndexElement = {
        index: -1,
        isZero: false,
      };

      let changedProduct = products.map((savedProduct, index) => {
        if (savedProduct.id === id && savedProduct.quantity !== 0) {
          return {
            ...savedProduct,
            quantity: savedProduct.quantity - 1,
          };
        }

        if (savedProduct.id === id && savedProduct.quantity === 0) {
          isQuantityZeroAndIndexElement = { index, isZero: true };
        }

        return savedProduct;
      });

      if (isQuantityZeroAndIndexElement.isZero) {
        changedProduct = products.splice(
          isQuantityZeroAndIndexElement.index,
          1,
        );
      }

      setProducts(changedProduct);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
