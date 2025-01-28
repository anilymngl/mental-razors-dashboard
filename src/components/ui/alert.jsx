import React from 'react';

export const Alert = ({ children, className = '' }) => (
  <div
    className={`p-4 border rounded-lg bg-blue-50 border-blue-400 text-blue-800 ${className}`}
  >
    {children}
  </div>
);

export const AlertTitle = ({ children, className = '' }) => (
  <h4 className={`font-bold mb-1 ${className}`}>{children}</h4>
);

export const AlertDescription = ({ children, className = '' }) => (
  <p className={className}>{children}</p>
);
