import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  ShoppingBag, 
  BarChart3, 
  Menu,
  Heart
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const { isAdmin } = useAuth();
  
  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Define all navigation items
  const allNavigationItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard', adminOnly: true },
    { path: '/patients', icon: <Users size={20} />, label: 'Patients', adminOnly: false },
    { path: '/billing', icon: <Receipt size={20} />, label: 'Billing', adminOnly: false },
    { path: '/services', icon: <ShoppingBag size={20} />, label: 'Services', adminOnly: false },
    { path: '/reports', icon: <BarChart3 size={20} />, label: 'Reports', adminOnly: true },
  ];
  
  // Filter navigation items based on user role
  const navigationItems = allNavigationItems.filter(item => {
    // If the item is admin-only, only show it to admins
    if (item.adminOnly) {
      return isAdmin();
    }
    // Otherwise, show it to everyone
    return true;
  });

  return (
    <div className={`fixed inset-y-0 left-0 z-10 flex flex-col bg-white border-r shadow-sm transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-4 border-b flex items-center justify-between">
        {sidebarOpen ? (
          <Link to="/" className="flex items-center space-x-2 text-blue-600 font-bold text-xl">
            <Heart className="text-blue-600" />
            <span>ClinicPro</span>
          </Link>
        ) : (
          <Link to="/" className="flex items-center justify-center w-full">
            <Heart className="text-blue-600" />
          </Link>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 md:block hidden"
        >
          <Menu size={18} />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="px-2 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                isActivePath(item.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${!sidebarOpen && 'justify-center'}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;