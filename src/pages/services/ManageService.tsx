import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, Save, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import PageHeader from '../../components/ui/PageHeader';
import { useApi } from '../../hooks/useApi';
import { serviceApi, type Service } from '../../services/api';

interface FormData {
  name: string;
  category: string;
  price: string;
  description: string;
}

const categories = [
  { value: 'Consultation', label: 'Consultation' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Radiology', label: 'Radiology' },
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Therapy', label: 'Therapy' },
  { value: 'Vaccination', label: 'Vaccination' },
  { value: 'Dental', label: 'Dental' },
  { value: 'Other', label: 'Other' }
];

const ManageService: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  
  const { data: service, loading } = useApi<Service>(() => serviceApi.getById(parseInt(id || '0')));
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    category: '',
    price: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saving, setSaving] = useState(false);
  
  // Populate form when service data is available in edit mode
  useEffect(() => {
    if (isEditMode && service) {
      setFormData({
        name: service.name,
        category: service.category,
        price: service.price.toString(),
        description: service.description || ''
      });
    }
  }, [isEditMode, service]);
  
  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Service name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.price.trim()) newErrors.price = 'Price is required';
    else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Price must be a valid positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      // Prepare the service data
      const serviceData = {
        name: formData.name,
        category: formData.category as Service['category'],
        price: parseFloat(formData.price),
        description: formData.description,
        is_active: true
      };
      
      if (isEditMode && id) {
        // Update existing service
        await serviceApi.update(parseInt(id), serviceData);
      } else {
        // Create new service
        await serviceApi.create(serviceData);
      }
      
      // Navigate back to services list on success
      navigate('/services');
      
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div>
      <PageHeader 
        title={isEditMode ? 'Edit Service' : 'Add New Service'} 
        icon={<ShoppingBag size={24} />}
      >
        <p>{isEditMode ? 'Update service details' : 'Enter details to add a new service'}</p>
      </PageHeader>
      
      <Card>
        {loading && isEditMode ? (
          <div className="py-20 text-center animate-pulse">
            <p className="text-gray-500">Loading service details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <FormInput
                  id="name"
                  name="name"
                  label="Service Name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  placeholder="Enter service name"
                  required
                />
              </div>
              
              <FormSelect
                id="category"
                name="category"
                label="Category"
                value={formData.category}
                onChange={handleChange}
                error={errors.category}
                options={categories}
                required
              />
              
              <FormInput
                id="price"
                name="price"
                label="Price (₹)"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                error={errors.price}
                placeholder="Enter price"
                required
              />
              
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter service description"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/services')}
                icon={<X size={18} />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                icon={<Save size={18} />}
              >
                {saving ? 'Saving...' : isEditMode ? 'Update Service' : 'Save Service'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ManageService;