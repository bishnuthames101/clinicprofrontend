import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Edit, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import { useApi } from '../../hooks/useApi';
import { serviceApi, type Service } from '../../services/api';

const ServicesList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, error, execute: fetchServices } = useApi(serviceApi.getAll);
  const services = Array.isArray((data as any)?.results)
    ? (data as any).results
    : Array.isArray(data)
      ? data
      : [];
      
  useEffect(() => {
    fetchServices();
  }, []);
  
  const filteredServices = services.filter((service: Service) => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const categoryColors: Record<string, string> = {
    'Consultation': 'primary',
    'Laboratory': 'info',
    'Radiology': 'warning',
    'Cardiology': 'danger',
    'Therapy': 'success',
    'Vaccination': 'secondary',
    'Dental': 'primary'
  };
  
  return (
    <div>
      <PageHeader 
        title="Services Management" 
        actionLabel="Add New Service" 
        actionPath="/services/add"
        icon={<ShoppingBag size={24} />}
      >
        <p>Manage all services offered by the clinic.</p>
      </PageHeader>
      
      <Card>
        <div className="mb-4 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <p className="text-gray-500">Loading services...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-red-500">Error loading services</p>
          </div>
        ) : (
          <Table
            headers={['Service Name', 'Category', 'Price', 'Description', 'Actions']}
          >
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No services found matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredServices.map((service: Service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{service.name}</td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        (categoryColors[service.category] as any) || 'secondary'
                      }
                    >
                      {service.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-medium">₹{(typeof service.price === 'number' ? service.price : Number(service.price)).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                    {service.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Link to={`/services/edit/${service.id}`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          icon={<Edit size={16} />}
                        >
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                        icon={<Trash2 size={16} />}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
        
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredServices.length} of {services.length} services
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ServicesList;