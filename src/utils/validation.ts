import { Patient, Service, Bill } from '../services/api';

export const validatePatient = (data: Partial<Patient>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.age) {
    errors.age = 'Age is required';
  } else if (data.age < 0 || data.age > 150) {
    errors.age = 'Age must be between 0 and 150';
  }

  if (!data.gender) {
    errors.gender = 'Gender is required';
  } else if (!['Male', 'Female', 'Other'].includes(data.gender)) {
    errors.gender = 'Invalid gender selection';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^\d{10}$/.test(data.phone)) {
    errors.phone = 'Phone number must be 10 digits';
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.address?.trim()) {
    errors.address = 'Address is required';
  }

  return errors;
};

export const validateService = (data: Partial<Service>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'Service name is required';
  }

  if (!data.price) {
    errors.price = 'Price is required';
  } else if (data.price < 0) {
    errors.price = 'Price cannot be negative';
  }

  if (!data.category) {
    errors.category = 'Category is required';
  } else if (![
    'Consultation',
    'Laboratory',
    'Radiology',
    'Cardiology',
    'Therapy',
    'Vaccination',
    'Dental'
  ].includes(data.category)) {
    errors.category = 'Invalid category';
  }

  return errors;
};

export const validateBill = (data: Partial<Bill>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.patient) {
    errors.patient = 'Patient is required';
  }

  if (!data.items?.length) {
    errors.items = 'At least one item is required';
  }

  if (typeof data.vat_rate === 'number' && (data.vat_rate < 0 || data.vat_rate > 100)) {
    errors.vat_rate = 'VAT rate must be between 0 and 100';
  }

  if (data.discount_type && !['percentage', 'amount'].includes(data.discount_type)) {
    errors.discount_type = 'Invalid discount type';
  }

  if (typeof data.discount_value === 'number' && data.discount_value < 0) {
    errors.discount_value = 'Discount value cannot be negative';
  }

  if (data.discount_type === 'percentage' && 
      typeof data.discount_value === 'number' && 
      data.discount_value > 100) {
    errors.discount_value = 'Percentage discount cannot exceed 100%';
  }

  return errors;
}; 