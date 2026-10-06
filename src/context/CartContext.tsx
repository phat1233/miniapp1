import React, { createContext, useContext, useState, ReactNode } from 'react';

// 1. Định nghĩa kiểu dữ liệu Sản phẩm
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

// 2. Định nghĩa kiểu dữ liệu Món trong Giỏ hàng
export interface CartItem {
  product: Product;
  quantity: number;
}

// 3. Định nghĩa các hàm & biến mà CartContext sẽ cung cấp cho toàn app
interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // 🛒 HÀM 1: Thêm sản phẩm vào giỏ
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      // Tìm xem sản phẩm đã có trong giỏ chưa
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      
      if (existingIndex > -1) {
        // Nếu đã có: Tạo mảng mới và tăng số lượng thêm 1
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      // Nếu chưa có: Thêm phần tử mới vào mảng giỏ hàng
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  // 🗑️ HÀM 2: Xóa hẳn sản phẩm khỏi giỏ
  const removeFromCart = (productId: string) => {
    // filter: Giữ lại những món có ID khác với ID cần xóa
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // ➕➖ HÀM 3: Tăng/Giảm số lượng sản phẩm (delta: +1 hoặc -1)
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null); // Loại bỏ sản phẩm có số lượng = 0
    });
  };

  // 🧹 HÀM 4: Xóa sạch giỏ hàng (khi thanh toán thành công)
  const clearCart = () => setCart([]);

  // 💰 TÍNH TỔNG TIỀN: reduce cộng dồn (giá * số lượng)
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // 🔢 TÍNH TỔNG SỐ LƯỢNG MÓN: reduce cộng dồn các quantity
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook để lấy dữ liệu ngắn gọn ở các màn hình
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart phải được dùng bên trong CartProvider');
  return context;
};