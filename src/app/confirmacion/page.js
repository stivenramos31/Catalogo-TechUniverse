"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConfirmacionContenido() {
  const searchParams = useSearchParams();
  const codigo = searchParams.get("codigo") || "COT-PENDIENTE";

  return (
    <div className="bg-white rounded-2xl border p-12 text-center max-w-2xl mx-auto">
      <div className="w-24 h-24 bg-[#16a34a] text-white rounded-full flex items-center justify-center text-5xl mx-auto mb-6">✓</div>
      <h1 className="text-4xl font-black mb-4">¡Solicitud Enviada!</h1>
      <p className="text-2xl font-black text-[#2563eb] my-6">{codigo}</p>
      <Link href="/catalogo" className="bg-[#2563eb] text-white font-bold py-3.5 px-8 rounded-xl">Volver al catálogo</Link>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <div className="py-24 px-4"><Suspense><ConfirmacionContenido /></Suspense></div>
  );
}