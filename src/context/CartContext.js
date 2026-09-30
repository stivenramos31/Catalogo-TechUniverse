"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [ofertasFlash, setOfertasFlash] = useState([]);
  const [cargado, setCargado] = useState(false);

  // ⚡ 1. Estados para la Animación Visual (Toast)
  const [toast, setToast] = useState({ mostrar: false, titulo: "" });
  const timerRef = useRef(null);

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

  // Cargar ofertas activas desde Supabase para aplicar descuentos por cantidad o promoción
  const cargarOfertasActivas = async () => {
    try {
      const { data, error } = await supabase
        .from("ofertas_flash")
        .select("*")
        .order("id", { ascending: false });

      if (!error && data) {
        const ahora = new Date();
        const vigentes = data.filter((of) => {
          if (of.activo === false) return false;
          if (of.fecha_fin && new Date(of.fecha_fin) < ahora) return false;
          return true;
        });
        setOfertasFlash(vigentes);
      }
    } catch (err) {
      console.error("Error al cargar ofertas flash:", err);
    }
  };

  useEffect(() => {
    cargarOfertasActivas();
  }, [cart.length]);

  useEffect(() => {
    if (cargado) {
      localStorage.setItem("tech_universe_cart", JSON.stringify(cart));
    }
  }, [cart, cargado]);

  // ⚡ 2. Función para disparar la animación
  const mostrarNotificacion = (titulo) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ mostrar: true, titulo });

    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, mostrar: false }));
    }, 2500);
  };

  const agregarAlCarrito = (producto) => {
    setCart((prevCart) => {
      const productoExistente = prevCart.find(
        (item) => String(item.id) === String(producto.id)
      );

      if (productoExistente) {
        return prevCart.map((item) =>
          String(item.id) === String(producto.id)
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [...prevCart, { ...producto, cantidad: 1 }];
    });

    mostrarNotificacion(producto.titulo);
  };

  const eliminarDelCarrito = (id) => {
    setCart((prevCart) => {
      const productoExistente = prevCart.find(
        (item) => String(item.id) === String(id)
      );

      if (productoExistente?.cantidad > 1) {
        return prevCart.map((item) =>
          String(item.id) === String(id)
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        );
      }

      return prevCart.filter((item) => String(item.id) !== String(id));
    });
  };

  const vaciarCarrito = () => {
    setCart([]);
  };

  // ⚡ Calcula el precio unitario real evaluando si cumple la cantidad de la Oferta Flash
  const obtenerInfoPrecioItem = (item) => {
    const precioNormal = parseFloat(item.precio_actual) || 0;
    const oferta = ofertasFlash.find(
      (of) => String(of.producto_id) === String(item.id)
    );

    if (!oferta) {
      return {
        precioUnitario: precioNormal,
        precioNormal,
        tieneOfertaAplicada: false,
        ofertaDisponible: null,
      };
    }

    const precioPromo = parseFloat(
      oferta.precio_promocion ?? oferta.precio_promocional ?? precioNormal
    );
    const cantidadMinima = Math.max(parseInt(oferta.stock_promocion) || 1, 1);

    if (item.cantidad >= cantidadMinima && precioPromo < precioNormal) {
      return {
        precioUnitario: precioPromo,
        precioNormal,
        tieneOfertaAplicada: true,
        cantidadMinima,
        precioPromo,
        ofertaDisponible: oferta,
      };
    }

    return {
      precioUnitario: precioNormal,
      precioNormal,
      tieneOfertaAplicada: false,
      cantidadMinima,
      precioPromo,
      ofertaDisponible: precioPromo < precioNormal ? oferta : null,
    };
  };

  const total = cart.reduce((acc, item) => {
    const { precioUnitario } = obtenerInfoPrecioItem(item);
    return acc + precioUnitario * item.cantidad;
  }, 0);

  const cantidadTotal = cart.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        carrito: cart,
        ofertasFlash,
        obtenerInfoPrecioItem,
        agregarAlCarrito,
        eliminarDelCarrito,
        vaciarCarrito,
        total,
        cantidadTotal,
        cargado,
      }}
    >
      {children}

      {/* ⚡ 4. INTERFAZ DE LA ANIMACIÓN FLOTANTE GLOBAL */}
      <div
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[100] flex items-center gap-4 bg-[#111827] text-white px-5 py-4 rounded-2xl shadow-2xl border border-gray-700 transition-all duration-500 ease-out 
        ${
          toast.mostrar
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-12 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="bg-[#16a34a] rounded-full p-1.5 flex-shrink-0 shadow-lg shadow-green-500/30">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-wide text-gray-100">
            ¡Agregado al carrito!
          </span>
          <span className="text-xs text-gray-400 max-w-[200px] truncate font-medium">
            {toast.titulo}
          </span>
        </div>
      </div>
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);