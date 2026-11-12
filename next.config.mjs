/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Tus IPs para pruebas locales (Móvil)
  allowedDevOrigins: [
    '192.168.0.6', 
    '192.168.56.1', 
    '172.22.240.1',
    'localhost'
  ],
  
  // 2. Permisos para que Next/Image optimice las fotos de tu Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbgzytybqjwkcfivdtzt.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;