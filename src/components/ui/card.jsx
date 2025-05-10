import React from 'react';

export const Card = ({ className, ...props }) => {
  return (
    <div
      className={`rounded-lg border bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700 ${className}`}
      {...props}
    />
  );
};

export const CardHeader = ({ className, ...props }) => {
  return <div className={`p-6 pb-0 ${className}`} {...props} />;
};

export const CardTitle = ({ className, ...props }) => {
  return (
    <h3
      className={`text-lg font-medium leading-none dark:text-white ${className}`}
      {...props}
    />
  );
};

export const CardContent = ({ className, ...props }) => {
  return <div className={`p-6 ${className}`} {...props} />;
};
