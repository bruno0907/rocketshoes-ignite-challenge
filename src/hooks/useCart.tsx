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

  const addProduct = async (productId: number) => {    
    try {  
      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)      
      if(!stock) throw new Error()
      
      const productInCart = cart.find(product => product.id === productId)  
      const amount = productInCart ? productInCart.amount + 1 : 0 

      if(stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }  

      if(productInCart){          
        const updatedCart = cart.map(product => 
          product.id === productId ? {
            ...product,
            amount: product.amount + 1
          } : product
        )
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)) 

      } else {
        const { data: product } = await api.get<Product>(`/products/${productId}`) 
        if(!product) throw Error()     

        const newProduct = {
          ...product,
          amount: 1
        }
        
        setCart([...cart, newProduct])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]))        
      }
      return
    } catch {
      toast.error('Erro na adição do produto')
      return
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productInCart = cart.find(product => product.id === productId)      
      if(!productInCart) throw Error()

      const updatedCart = cart.filter(product => product.id !== productId)
      setCart(updatedCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

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
      if(amount <= 0) return

      const { data: stock } = await api.get<Stock>(`/stock/${productId}`)      
      if(!stock) throw Error()

      if(amount > stock.amount){        
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      const productInCart = cart.find(product => product.id === productId)
      if(!productInCart) throw Error()
        
      const updatedCart = cart.map(product => product.id === productId ? {
        ...product,
        amount
      } : product)
  
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      return
    } catch (error) {
      toast.error('Erro na alteração de quantidade do produto')      
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
