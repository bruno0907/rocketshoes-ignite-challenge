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
      if(!stock) return

      if(stock.amount <= 1) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }  

      const productInCart = cart.find(product => product.id === productId)   

      if(!productInCart){      
        const { data: product } = await api.get<Product>(`/products/${productId}`) 
        if(!product) return     

        const newProduct = {
          ...product,
          amount: 1
        }
        
        setCart([...cart, newProduct])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]))

        await api.put(`/stock/${productId}`, { amount: stock.amount - 1 })

        return
      } else {
        const productsInCart = cart.map(product => 
          product.id === productId ? {
            ...product,
            amount: product.amount + 1
          } : product
        )
        setCart(productsInCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(productsInCart))    

        await api.put(`/stock/${productId}`, { amount: stock.amount - 1 })        
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
      
      if(!productInCart) {
        toast.error('Erro na remoção do produto')        
        return
      }

      const cartWithRemainingProducts = cart.filter(product => product.id !== productId)
      setCart(cartWithRemainingProducts)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartWithRemainingProducts))

      const { data: stock } = await api.get(`/stock/${productId}`)
      if(!stock) return

      await api.put<Stock>(`/stock/${productId}`, { amount: stock.amount + productInCart.amount })
      
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
      const { data: stock } = await api.get(`/stock/${productId}`)      
      if(!stock) return

      const productInCart = cart.find(product => product.id === productId)
      if(!productInCart) return

      if(amount > productInCart.amount){
        if(stock.amount <= 1) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
        
        const increasedProductAmountCart = cart.map(product => product.id === productId ? {
          ...product,
          amount: product.amount + 1
        } : product)
  
        setCart(increasedProductAmountCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(increasedProductAmountCart))
        
        await api.put<Stock>(`/stock/${productId}`, { amount: stock.amount - 1 })        
  
        return
      }
      
      if(amount < productInCart.amount){
        if(amount < 1) return
      
        const decreasedProductAmountCart = cart.map(product => product.id === productId ? {
          ...product,
          amount: product.amount - 1
        } : product)

        setCart(decreasedProductAmountCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(decreasedProductAmountCart))

        let newAmount = stock.amount + 1

        await api.put<Stock>(`/stock/${productId}`, { amount: newAmount })

        return
      } 

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
