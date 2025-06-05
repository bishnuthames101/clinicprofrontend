import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';

interface PageHeaderProps {
  title: string;
  actionLabel?: string;
  actionPath?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  actionLabel,
  actionPath,
  icon,
  children,
}) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          {icon && <span className="mr-2 text-blue-600">{icon}</span>}
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>
        {actionLabel && actionPath && (
          <Link to={actionPath}>
            <Button>{actionLabel}</Button>
          </Link>
        )}
      </div>
      {children && <div className="text-gray-600">{children}</div>}
    </div>
  );
};

export default PageHeader;