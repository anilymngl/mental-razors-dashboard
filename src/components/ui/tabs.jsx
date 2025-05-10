import React from 'react';

export const Tabs = ({ value, onValueChange, children }) => {
  const tabs = React.Children.toArray(children).filter((child) =>
    child.type === TabsList || child.type === TabsContent
  );

  const activeTab = tabs.find(
    (tab) => tab.props.value === value && tab.type === TabsContent
  );

  return (
    <div>
      {tabs.map((child) =>
        child.type === TabsList ? (
          React.cloneElement(child, { value, onValueChange })
        ) : null
      )}
      {activeTab}
    </div>
  );
};

export const TabsList = ({ value, onValueChange, children, className = '' }) => (
  <div className={`flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`}>
    {React.Children.map(children, (child) =>
      React.cloneElement(child, {
        isActive: value === child.props.value,
        onClick: () => onValueChange(child.props.value)
      })
    )}
  </div>
);

export const TabsTrigger = ({
  value,
  isActive,
  onClick,
  children,
  className = ''
}) => (
  <button
    onClick={onClick}
    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 disabled:opacity-50 disabled:pointer-events-none ${
      isActive 
        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700/50'
    } ${className}`}
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children }) => <div>{children}</div>;
