import React from 'react';

export const Alert = ({ className, ...props }) => {
  return (
    <div
      className={`rounded-lg border p-4 dark:bg-gray-800 dark:border-gray-700 ${className}`}
      {...props}
    />
  );
};

export const AlertTitle = ({ className, ...props }) => {
  return (
    <h5
      className={`mb-1 font-medium leading-none tracking-tight dark:text-white ${className}`}
      {...props}
    />
  );
};

export const AlertDescription = ({ className, ...props }) => {
  return (
    <div
      className={`text-sm dark:text-gray-300 ${className}`}
      {...props}
    />
  );
};
