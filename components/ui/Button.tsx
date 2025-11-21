import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyle = `
    inline-flex items-center justify-center 
    font-semibold
    rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none 
    focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary
    dark:focus-visible:ring-offset-background-dark
    disabled:opacity-60 disabled:cursor-not-allowed
  `;

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: 'bg-gradient-primary text-white shadow-md hover:shadow-lg hover:brightness-110 active:brightness-100 disabled:shadow-none',
    secondary: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-slate-400 dark:active:bg-slate-500 disabled:shadow-none',
    ghost: 'bg-transparent shadow-none hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300',
  };

  return (
    <button
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;