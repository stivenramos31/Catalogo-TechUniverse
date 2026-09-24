"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [cargado, setCargado] = useState(false);

  // ⚡ 1. Estados para la Animación Visual (Toast)
  const [toast, setToast] = useState({ mostrar: false, titulo: "" });
  const timerRef = useRef(null); // Ref para reiniciar el tiempo si presiona rápido

  useEffect(() => {
    const carritoGuardado = localStorage.getItem("tech_universe_cart");
    if (carritoGuardado) {
      try {
        setCart(JSON.parse(carritoGuardado));
      } catch (error) {
        console.error("Error al leer el carrito:", error);
      }
    }
    setCargado(true);
  }, []);

  useEffect(() => {
    if (cargado) {
      localStorage.setItem("tech_universe_cart", JSON.stringify(cart));
    }
  }, [cart, cargado]);

  // ⚡ 2. Función para disparar la animación
  const mostrarNotificacion = (titulo) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ mostrar: true, titulo });
    
    // Se oculta sola después de 2.5 segundos
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, mostrar: false }));
    }, 2500); 
  };

  const agregarAlCarrito = (producto) => {
    setCart((prevCart) => {
      const productoExistente = prevCart.find(item => String(item.id) === String(producto.id));
      
      if (productoExistente) {
        return prevCart.map(item => 
          String(item.id) === String(producto.id) 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        );
      }
      return [...prevCart, { ...producto, cantidad: 1 }];
    });

    // ⚡ 3. Activamos la notificación visual con el nombre del producto
    mostrarNotificacion(producto.titulo);
  };

  const eliminarDelCarrito = (id) => {
    setCart((prevCart) => {
      const productoExistente = prevCart.find(item => String(item.id) === String(id));
      
      if (productoExistente?.cantidad > 1) {
        return prevCart.map(item => 
          String(item.id) === String(id) 
            ? { ...item, cantidad: item.cantidad - 1 } 
            : item
        );
      }
      
      return prevCart.filter(item => String(item.id) !== String(id));
    });
  };

  const vaciarCarrito = () => {
    setCart([]);
  };

  const total = cart.reduce((acc, item) => acc + (parseFloat(item.precio_actual) || 0) * item.cantidad, 0);
  const cantidadTotal = cart.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      agregarAlCarrito, 
      eliminarDelCarrito, 
      vaciarCarrito, 
      total, 
      cantidadTotal,
      cargado 
    }}>
      {children}

      {/* ⚡ 4. INTERFAZ DE LA ANIMACIÓN FLOTANTE GLOBAL */}
      <div 
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] flex items-center gap-4 bg-[#111827] text-white px-5 py-4 rounded-2xl shadow-2xl border border-gray-700 transition-all duration-500 ease-out 
        ${toast.mostrar ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95 pointer-events-none'}`}
      >
        <div className="bg-[#16a34a] rounded-full p-1.5 flex-shrink-0 shadow-lg shadow-green-500/30">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-wide text-gray-100">¡Agregado al carrito!</span>
          <span className="text-xs text-gray-400 max-w-[200px] truncate font-medium">{toast.titulo}</span>
        </div>
      </div>

    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);