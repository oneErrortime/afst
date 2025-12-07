import { ButtonHTMLAttributes, forwardRef, useState } from 'react';
import { Loader2, Check } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  pulse?: boolean;
  ripple?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    loading, 
    success,
    icon,
    iconPosition = 'left',
    fullWidth,
    pulse,
    ripple = true,
    children, 
    disabled, 
    onClick,
    ...props 
  }, ref) => {
    const [rippleStyle, setRippleStyle] = useState<{ left: number; top: number } | null>(null);

    const baseStyles = `
      inline-flex items-center justify-center gap-2 
      rounded-xl font-semibold 
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      active:scale-[0.98]
      relative overflow-hidden
      select-none
    `;
    
    const variants = {
      primary: `
        bg-gradient-to-r from-primary-600 to-primary-500 
        text-white 
        hover:from-primary-700 hover:to-primary-600 
        hover:shadow-lg hover:shadow-primary-500/25
        focus:ring-primary-500
        active:from-primary-800 active:to-primary-700
      `,
      secondary: `
        bg-white text-gray-700 
        border-2 border-gray-200 
        hover:bg-gray-50 hover:border-gray-300 hover:shadow-md
        focus:ring-primary-500
        active:bg-gray-100
      `,
      danger: `
        bg-gradient-to-r from-red-600 to-red-500 
        text-white 
        hover:from-red-700 hover:to-red-600 
        hover:shadow-lg hover:shadow-red-500/25
        focus:ring-red-500
        active:from-red-800 active:to-red-700
      `,
      ghost: `
        text-gray-600 
        hover:bg-gray-100 hover:text-gray-900
        focus:ring-gray-400
        active:bg-gray-200
      `,
      success: `
        bg-gradient-to-r from-green-600 to-green-500 
        text-white 
        hover:from-green-700 hover:to-green-600 
        hover:shadow-lg hover:shadow-green-500/25
        focus:ring-green-500
        active:from-green-800 active:to-green-700
      `,
      warning: `
        bg-gradient-to-r from-amber-500 to-amber-400 
        text-white 
        hover:from-amber-600 hover:to-amber-500 
        hover:shadow-lg hover:shadow-amber-500/25
        focus:ring-amber-500
        active:from-amber-700 active:to-amber-600
      `,
      outline: `
        bg-transparent text-primary-600 
        border-2 border-primary-600 
        hover:bg-primary-50 
        focus:ring-primary-500
        active:bg-primary-100
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm min-h-[32px]',
      md: 'px-4 py-2.5 text-sm min-h-[40px]',
      lg: 'px-6 py-3 text-base min-h-[48px]',
      xl: 'px-8 py-4 text-lg min-h-[56px]',
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (ripple && !disabled && !loading) {
        const rect = e.currentTarget.getBoundingClientRect();
        setRippleStyle({
          left: e.clientX - rect.left,
          top: e.clientY - rect.top,
        });
        setTimeout(() => setRippleStyle(null), 600);
      }
      onClick?.(e);
    };

    const content = (
      <>
        {ripple && rippleStyle && (
          <span
            className="absolute rounded-full bg-white/30 animate-ping"
            style={{
              left: rippleStyle.left - 10,
              top: rippleStyle.top - 10,
              width: 20,
              height: 20,
            }}
          />
        )}
        
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {success && !loading && <Check className="h-4 w-4 animate-bounce" />}
        
        {icon && iconPosition === 'left' && !loading && !success && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        
        {children && <span>{children}</span>}
        
        {icon && iconPosition === 'right' && !loading && !success && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </>
    );

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles} 
          ${variants[variant]} 
          ${sizes[size]} 
          ${fullWidth ? 'w-full' : ''} 
          ${pulse ? 'animate-pulse' : ''} 
          ${className}
        `}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
