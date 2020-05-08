import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

const STORAGE_KEY = '@GoMarketplace:Cart';

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
      const storage = await AsyncStorage.getItem(STORAGE_KEY);
      if (storage) {
        setProducts(JSON.parse(storage));
      }
    }

    loadProducts();
  }, []);

  const saveOnStorage = useCallback(async data => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const findProduct = useCallback(
    id => {
      const productList = [...products];
      const index = productList.findIndex(
        productListItem => productListItem.id === id,
      );

      return { productList, index };
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const { productList, index } = findProduct(product.id);

      if (index >= 0) {
        productList[index].quantity += 1;
        setProducts(productList);
      } else {
        setProducts([...productList, { ...product, quantity: 1 }]);
      }

      saveOnStorage(productList);
    },
    [findProduct, saveOnStorage],
  );

  const increment = useCallback(
    async id => {
      const { productList, index } = findProduct(id);

      if (index > -1) {
        productList[index].quantity += 1;
        setProducts(productList);
      }

      saveOnStorage(productList);
    },
    [findProduct, saveOnStorage],
  );

  const decrement = useCallback(
    async id => {
      const { productList, index } = findProduct(id);
      const product = productList[index];

      if (index > -1 && product.quantity > 1) {
        product.quantity -= 1;
        setProducts(productList);
        saveOnStorage(productList);
      } else {
        const updatedProductList = productList.filter(
          productListItem => productListItem.id !== product.id,
        );
        setProducts(updatedProductList);
        saveOnStorage(updatedProductList);
      }
    },
    [findProduct, saveOnStorage],
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
