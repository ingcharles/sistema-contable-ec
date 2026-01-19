import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
        './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                sri: {
                    blue: '#00548b',
                    light: '#007cc3',
                    gray: '#f4f6f9',
                },
            },
        },
    },
    plugins: [],
};

export default config;
