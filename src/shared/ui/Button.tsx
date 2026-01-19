import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
        const baseStyles = 'font-semibold rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

        const variantStyles = {
            primary: 'bg-sri-blue hover:bg-sri-light text-white focus:ring-sri-blue',
            secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
            danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        };

        const sizeStyles = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
        };

        const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

        return <button ref={ref} className={classes} {...props} />;
    }
);

Button.displayName = 'Button';
