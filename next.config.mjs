/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'app.sandbox.wisefacturacion.com',
                port: '',
                pathname: '/logos/**',
            },
            {
                protocol: 'https',
                hostname: 'api.wisefacturacion.com',
                port: '',
                pathname: '/logos/**',
            },
        ],
    },
    webpack: (config) => {
        config.cache = false;
        return config;
    },
    serverExternalPackages: ['pdf-parse', '@sparticuz/chromium', 'puppeteer-core'],
    outputFileTracingIncludes: {
        '/api/**/*': ['./node_modules/@sparticuz/chromium/bin/**'],
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
