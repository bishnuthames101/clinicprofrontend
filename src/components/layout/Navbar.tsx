import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, User, Menu, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';



const pathToTitle: Record<string, string> = {
  '/': 'Dashboard',
  '/patients': 'Patient Management',
  '/patients/add': 'Add New Patient',
  '/billing': 'Billing',
  '/billing/create': 'Create New Bill',
  '/services': 'Services Management',
  '/services/add': 'Add New Service',
  '/reports': 'Daily Reports',
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar } = useAppContext();
  const { user, logout } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current && 
        userButtonRef.current && 
        !userMenuRef.current.contains(event.target as Node) &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  const getPageTitle = () => {
    if (location.pathname.match(/^\/patients\/\d+$/)) {
      return 'Patient Profile';
    }
    if (location.pathname.match(/^\/services\/edit\/\d+$/)) {
      return 'Edit Service';
    }
    return pathToTitle[location.pathname] || 'Clinic Management';
  };



  return (
    <header className="bg-white border-b px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-1.5 mr-3 rounded-lg hover:bg-gray-100 md:hidden"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative hidden md:block">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-1.5 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          

          
          <div className="relative">
            <button 
              ref={userButtonRef}
              className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium border border-blue-200 hover:bg-blue-200 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.username ? (
                <span className="font-medium">{user.username.charAt(0).toUpperCase()}</span>
              ) : (
                <User size={18} />
              )}
            </button>
            
            {showUserMenu && (
              <div 
                ref={userMenuRef}
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1"
              >
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
                
                <div className="py-1">
                  
                  
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;