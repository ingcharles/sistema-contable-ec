import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: false,
    },
    serverExternalPackages: ['libxmljs2', 'xsd-schema-validator'],
};

export default nextConfig;
