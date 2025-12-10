/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'app.sandbox.wisefacturacion.com',
                port: '',
                pathname: '/logos/**',
            },
        ],
    },
    webpack: (config) => {
        config.cache = false;
        return config;
    },
};

export default nextConfig;
