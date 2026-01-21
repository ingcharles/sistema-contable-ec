'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
        const baseStyles = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

        const variantStyles = {
            primary: 'bg-sri-blue hover:bg-sri-light text-white focus:ring-sri-blue shadow-sm',
            secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400',
            danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm',
            warning: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 shadow-sm',
            success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm',
            ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-300',
            outline: 'bg-transparent border border-slate-200 hover:bg-slate-50 text-slate-700 focus:ring-slate-200',
        };

        const sizeStyles = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
        };

        const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

        return (
            <button
                ref={ref}
                className={classes}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="animate-spin" size={18} />}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
