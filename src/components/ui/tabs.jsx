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
  <div className={`flex space-x-4 ${className}`}>
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
    className={`px-4 py-2 rounded ${
      isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
    } ${className}`}
  >
    {children}
  </button>
);

export const TabsContent = ({ value, children }) => <div>{children}</div>;
