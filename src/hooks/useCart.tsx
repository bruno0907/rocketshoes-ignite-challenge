import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });  

  const [productsStock, setProductsStock] = useState<Stock[]>([])

  const addProduct = async (productId: number) => {    
    try {             
      const productInStock = await api.get(`/stock/${productId}`)
    
      if(!productInStock){
        return      
      }
      
      const { amount } = productInStock.data
    
      if(amount === 0) {        
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      
      const productInCart = cart.find(product => product.id === productId)      
      
      if(productInCart){   
        const productsInCart = cart.map(product => 
          product.id === productId ? {
            ...product,
            amount: product.amount + 1
          } : product
        )
        setCart(productsInCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(productsInCart))
        return
      }
      const { data } = await api.get(`/products/${productId}`)

      const newProduct = {
        ...data,
        amount: 1
      }
      setCart([...cart, newProduct])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]))
      return

    } catch {
      toast.error('Erro na adição do produto')
      return

    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const cartWithRemovedProduct = cart.filter(product => product.id !== productId)
      setCart(cartWithRemovedProduct)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartWithRemovedProduct))
      return

    } catch {      
      toast.error('Erro na remoção do produto')
      return

    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {      
    try {           
      // TODO

    } catch (error) {
      toast.error('Erro na adição do produto')      
      return

    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
