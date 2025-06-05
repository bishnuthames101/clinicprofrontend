import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAppContext } from '../../context/AppContext';

const Layout: React.FC = () => {
  const { sidebarOpen } = useAppContext();
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <Navbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
        <footer className="px-6 py-3 bg-white border-t text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Local Clinic Management System</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;