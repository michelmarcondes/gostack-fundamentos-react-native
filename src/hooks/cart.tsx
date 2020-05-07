import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

const STORAGE_KEY = '@GoMarketplace';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const loadedProducts: Product[] = [];
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagekeys = await AsyncStorage.getAllKeys();
      const storagedProducts = await AsyncStorage.multiGet(storagekeys);

      // clear storage
      // storagedProducts.map(async storagePair => {
      //   await AsyncStorage.removeItem(storagePair[0]);
      //   setProducts([]);
      // });

      console.log(`cartProducts: ${storagedProducts}`);

      storagedProducts.forEach(storagePair => {
        if (storagePair[1]) {
          const product = JSON.parse(storagePair[1]);
          loadedProducts.push(product);
        }
      });

      setProducts(loadedProducts);
    }

    // if (products.length === 0) {
    loadProducts();
    // }
  }, []);

  const increment = useCallback(
    async id => {
      const key = `${STORAGE_KEY}:${id}`;

      // try {
      const savedProduct = await AsyncStorage.getItem(key).then(p => {
        return p && JSON.parse(p);
      });

      const productDelta = { quantity: savedProduct.quantity + 1 };
      await AsyncStorage.mergeItem(key, JSON.stringify(productDelta));

      const newProduct = await AsyncStorage.getItem(key).then(p => {
        return p && JSON.parse(p);
      });

      setProducts(
        products.map(prod =>
          prod.id === newProduct.id
            ? { ...prod, quantity: newProduct.quantity }
            : prod,
        ),
      );
      // } catch (err) {
      //   console.log(err);
      // }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      console.log(products);
      const productInCart = products.find(
        savedProduct => savedProduct.id === product.id,
      );

      if (productInCart) {
        increment(product.id);
        return;
      }

      await AsyncStorage.setItem(
        `${STORAGE_KEY}:${product.id}`,
        JSON.stringify(product),
      );

      setProducts([...products, product]);
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const key = `${STORAGE_KEY}:${id}`;

      const savedProduct = await AsyncStorage.getItem(key).then(p => {
        return p && JSON.parse(p);
      });

      if (savedProduct.quantity === 1) {
        // remove from storage
        await AsyncStorage.removeItem(key);
        // remove from state
        setProducts(products.filter(prod => prod.id !== id));
      } else {
        const productDelta = { quantity: savedProduct.quantity - 1 };
        await AsyncStorage.mergeItem(key, JSON.stringify(productDelta));

        const newProduct = await AsyncStorage.getItem(key).then(p => {
          return p && JSON.parse(p);
        });

        setProducts(
          products.map(prod =>
            prod.id === newProduct.id
              ? { ...prod, quantity: newProduct.quantity }
              : prod,
          ),
        );
      }
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
