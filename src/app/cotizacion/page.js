"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CotizacionRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/carrito");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center font-bold text-gray-400">
      Redirigiendo al carrito...
    </div>
  );
}