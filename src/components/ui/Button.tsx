import React from 'react';
export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(function Button({ className = '', type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={`ui-button ${className}`} {...props} />;
});
