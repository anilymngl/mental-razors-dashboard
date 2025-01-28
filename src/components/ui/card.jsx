import React from 'react';

export const Card = ({ className = '', children }) => (
  <div className={`bg-white shadow rounded-lg p-4 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children }) => (
  <div className="border-b pb-2 mb-4">{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold ${className}`}>{children}</h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);
