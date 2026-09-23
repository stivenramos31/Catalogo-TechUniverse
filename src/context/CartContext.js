"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [carrito, setCarrito] = useState([]);
  const [cargado, setCargado] = useState(false);

  // Cargar desde localStorage al inicio
  useEffect(() => {
    const guardado = localStorage.getItem("tech_universe_cart");
    if (guardado) {
      try {
        setCarrito(JSON.parse(guardado));
      } catch (error) {
        console.error("Error leyendo el carrito", error);
      }
    }
    setCargado(true);
  }, []);

  // Guardar en localStorage cada vez que cambia el carrito
  useEffect(() => {
    if (cargado) {
      localStorage.setItem("tech_universe_cart", JSON.stringify(carrito));
    }
  }, [carrito, cargado]);

  // Funciones reales de producción
  const agregarAlCarrito = (producto, cantidad = 1) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item
        );
      }
      return [...prev, { ...producto, cantidad }];
    });
  };

  const eliminarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setCarrito((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cantidad: nuevaCantidad } : item))
    );
  };

  const vaciarCarrito = () => setCarrito([]);

  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotal = carrito.reduce((sum, item) => sum + (item.precio_actual * item.cantidad), 0);

  return (
    <CartContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        totalItems,
        subtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);