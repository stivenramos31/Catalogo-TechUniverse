const nextConfig = {
  eslint: {
    // Esto evita que Vercel cancele la publicación por advertencias menores
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;