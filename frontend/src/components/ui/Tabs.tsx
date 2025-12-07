import React, { useState } from 'react';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export const Tabs = ({ children, defaultValue, value, onValueChange, className = '' }: TabsProps) => {
  const [localValue, setLocalValue] = useState(defaultValue || '');
  
  const currentValue = value !== undefined ? value : localValue;
  const changeValue = onValueChange || setLocalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: changeValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '' }: TabsListProps) => {
  return (
    <div className={`flex space-x-1 rounded-xl bg-gray-100 p-1 ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ value, children, className = '' }: TabsTriggerProps) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      className={`
        px-3 py-1.5 text-sm font-medium transition-all rounded-lg
        ${isActive 
          ? 'bg-white text-gray-900 shadow-sm' 
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
        }
        ${className}
      `}
      onClick={() => context.onValueChange(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '' }: TabsContentProps) => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return <div className={`mt-2 ${className}`}>{children}</div>;
};

// Compatible exports with the usage in ResourceManager
// Usage seen: <Tabs list={...}> <Tab ...> </Tabs> ?
// Error: `Module '"@/components/ui"' has no exported member 'Tabs'.`
// And `no exported member 'Tab'.`
// So it seems it expects `Tabs` and `Tab`.
// I will start by checking how ResourceManager USES it by reading the file.
