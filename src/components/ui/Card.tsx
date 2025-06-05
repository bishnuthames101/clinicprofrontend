import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white border rounded-lg shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b">
          <h3 className="font-medium text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};

export default Card;