/** @type {import('next').NextConfig} */
const nextConfig = {
  // En Next.js 16 va directamente aquí en la raíz, fuera de experimental
  allowedDevOrigins: ['192.168.0.6', '192.168.56.1', 'localhost'],
};

export default nextConfig;
