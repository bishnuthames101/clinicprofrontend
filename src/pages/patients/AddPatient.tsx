import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Save, X, Receipt } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import PageHeader from '../../components/ui/PageHeader';
import { useApi } from '../../hooks/useApi';
import { patientApi } from '../../services/api';

interface FormData {
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  medicalHistory: string;
}

const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    medicalHistory: '',
  });
  
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const redirectToBillingRef = useRef(false);
  const { loading, error: apiError, execute: createPatient } = useApi(patientApi.create, {
    successMessage: 'Patient added successfully',
    errorMessage: 'Failed to add patient',
    onSuccess: (created) => {
      if (redirectToBillingRef.current) {
        navigate(`/billing/create?patientId=${created.id}`);
      } else {
        navigate('/patients');
      }
    }
  });
  
  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.age.trim()) newErrors.age = 'Age is required';
    else if (isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      newErrors.age = 'Age must be a positive number';
    }
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    redirectToBillingRef.current = false;
    if (!validateForm()) return;
    const patientData = {
      name: formData.fullName,
      age: parseInt(formData.age),
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email || undefined,
      address: formData.address,
      medical_history: formData.medicalHistory || undefined,
    };
    createPatient(patientData);
  };

  const handleSaveAndCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    redirectToBillingRef.current = true;
    if (!validateForm()) return;
    const patientData = {
      name: formData.fullName,
      age: parseInt(formData.age),
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email || undefined,
      address: formData.address,
      medical_history: formData.medicalHistory || undefined,
    };
    createPatient(patientData);
  };
  
  return (
    <div>
      <PageHeader 
        title="Add New Patient" 
        icon={<UserPlus size={24} />}
      >
        <p>Enter patient details to add them to the system.</p>
      </PageHeader>
      
      <Card>
        <form>
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              id="fullName"
              name="fullName"
              label="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              error={errors.fullName}
              placeholder="Enter patient's full name"
              required
              disabled={loading}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="age"
                name="age"
                label="Age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                error={errors.age}
                placeholder="Age in years"
                required
                disabled={loading}
              />
              
              <FormSelect
                id="gender"
                name="gender"
                label="Gender"
                value={formData.gender}
                onChange={handleChange}
                error={errors.gender}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' }
                ]}
                required
                disabled={loading}
              />
            </div>
            
            <FormInput
              id="phone"
              name="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="10-digit mobile number"
              required
              disabled={loading}
            />
            
            <FormInput
              id="email"
              name="email"
              label="Email Address (Optional)"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="patient@example.com"
              disabled={loading}
            />
            
            <div className="md:col-span-2">
              <FormInput
                id="address"
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                placeholder="Full address with city and pincode"
                required
                disabled={loading}
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-1">
                Medical History (Optional)
              </label>
              <textarea
                id="medicalHistory"
                name="medicalHistory"
                rows={4}
                value={formData.medicalHistory}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                placeholder="Enter any relevant medical history"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <Button type="submit" icon={<Save size={18} />} loading={loading} onClick={handleSubmit}>
              Save Patient
            </Button>
            <Button type="button" icon={<Receipt size={18} />} loading={loading} onClick={handleSaveAndCreateBill}>
              Save & Create Bill
            </Button>
            <Button type="button" variant="outline" icon={<X size={18} />} onClick={() => navigate('/patients')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddPatient;