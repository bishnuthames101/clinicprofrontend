import React, { useState } from 'react';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import Button from './Button';
import { X, Save } from 'lucide-react';
import { Patient } from '../../services/api';
import { validatePatient } from '../../utils/validation';
import { useApi } from '../../hooks/useApi';
import { patientApi } from '../../services/api';

interface EditPatientFormProps {
  patient: Patient;
  onSave: (updatedPatient: Partial<Patient>) => void;
  onCancel: () => void;
}

const EditPatientForm: React.FC<EditPatientFormProps> = ({
  patient,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: patient.name,
    age: patient.age.toString(),
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email || '',
    address: patient.address,
    medical_history: patient.medical_history || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { loading, error: apiError, execute: updatePatient } = useApi(
    patientApi.update,
    {
      successMessage: 'Patient updated successfully',
      errorMessage: 'Failed to update patient',
      onSuccess: (updatedPatient) => {
        onSave(updatedPatient);
      },
    }
  );

  const validateForm = () => {
    const validationErrors = validatePatient({
      ...formData,
      age: parseInt(formData.age),
    });
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    await updatePatient(patient.id, {
      ...formData,
      age: parseInt(formData.age),
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {apiError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          id="name"
          name="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
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
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
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
            required
            disabled={loading}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-1">
            Medical History (Optional)
          </label>
          <textarea
            id="medical_history"
            name="medical_history"
            rows={4}
            value={formData.medical_history}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          icon={<X size={18} />}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          icon={<Save size={18} />}
          loading={loading}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default EditPatientForm;