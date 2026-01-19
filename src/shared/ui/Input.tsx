import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', error, ...props }, ref) => {
        const baseStyles = 'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 transition-colors';
        const normalStyles = 'border-gray-300 focus:border-sri-blue focus:ring-sri-blue';
        const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500';

        const classes = `${baseStyles} ${error ? errorStyles : normalStyles} ${className}`;

        return (
            <div className="w-full">
                <input ref={ref} className={classes} {...props} />
                {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
