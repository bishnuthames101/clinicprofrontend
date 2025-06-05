import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Receipt, Search, Plus, Trash2, Save, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import PageHeader from '../../components/ui/PageHeader';
import { useApi } from '../../hooks/useApi';
import { patientApi, serviceApi, billingApi, type Patient, type Service } from '../../services/api';

interface BillItem {
  id: number;
  serviceId: number;
  serviceName: string;
  quantity: number;
  price: number;
  total: number;
}

const CreateBill: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPatientId = queryParams.get('patientId');

  // Use useApi for fetching patients and services
  const { data: patientsData, loading: patientsLoading, execute: fetchPatients } = useApi(patientApi.getAll);
  const { data: servicesData, loading: servicesLoading, execute: fetchServices } = useApi(serviceApi.getAll);

  const patients: Patient[] = Array.isArray((patientsData as any)?.results)
    ? (patientsData as any).results
    : Array.isArray(patientsData)
      ? patientsData
      : [];
  const services: Service[] = Array.isArray((servicesData as any)?.results)
    ? (servicesData as any).results
    : Array.isArray(servicesData)
      ? servicesData
      : [];

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(!initialPatientId);

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Bill creation API
  const { loading: createLoading, error: createError, execute: createBill } = useApi(
    billingApi.create,
    {
      successMessage: 'Bill created successfully',
      errorMessage: 'Failed to create bill',
      onSuccess: () => navigate('/billing'),
    }
  );

  // Fetch patients and services on mount
  useEffect(() => {
    fetchPatients();
    fetchServices();
  }, []);

  // Find patient by ID when initialPatientId is provided
  useEffect(() => {
    if (initialPatientId && patients.length > 0) {
      const patient = patients.find((p: Patient) => p.id === parseInt(initialPatientId));
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [initialPatientId, patients]);

  // Calculate totals whenever bill items or discounts change
  useEffect(() => {
    const calculatedSubtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(calculatedSubtotal);

    let calculatedDiscountAmount = 0;
    if (discountType === 'percentage') {
      calculatedDiscountAmount = (calculatedSubtotal * parseFloat(discountValue || '0')) / 100;
    } else {
      calculatedDiscountAmount = parseFloat(discountValue || '0');
    }
    setDiscountAmount(calculatedDiscountAmount);

    const calculatedGrandTotal = calculatedSubtotal - calculatedDiscountAmount;
    setGrandTotal(calculatedGrandTotal);
  }, [billItems, discountType, discountValue]);

  const filteredPatients = patients.filter((patient: Patient) => 
    patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
    patient.phone.includes(patientSearchTerm)
  );

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientSearch(false);
  };

  const addBillItem = () => {
    // Add a new empty bill item
    const newItem: BillItem = {
      id: Date.now(), // Temporary ID for local state management
      serviceId: 0,
      serviceName: '',
      quantity: 1,
      price: 0,
      total: 0
    };
    setBillItems([...billItems, newItem]);
  };

  const updateBillItem = (id: number, field: keyof BillItem, value: any) => {
    setBillItems(prevItems => 
      prevItems.map(item => {
        if (item.id !== id) return item;
        const updatedItem = { ...item, [field]: value };
        // If service is changed, update price and name
        if (field === 'serviceId') {
          const selectedService = services.find((s: Service) => s.id === value);
          if (selectedService) {
            updatedItem.serviceName = selectedService.name;
            updatedItem.price = selectedService.price;
          }
        }
        // Recalculate total
        updatedItem.total = updatedItem.price * updatedItem.quantity;
        return updatedItem;
      })
    );
  };

  const removeBillItem = (id: number) => {
    setBillItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select a patient');
      return;
    }
    if (billItems.length === 0) {
      alert('Please add at least one service');
      return;
    }
    if (billItems.some(item => item.serviceId === 0)) {
      alert('Please select services for all items');
      return;
    }
    // Prepare items for API
    const itemsForApi = billItems.map(item => ({
      serviceId: item.serviceId,
      quantity: item.quantity
    }));
    const billData = {
      patientId: selectedPatient.id,
      items: itemsForApi,
      discountType,
      discountValue: parseFloat(discountValue || '0'),
      notes: ""
    };
    console.log('Sending bill data:', JSON.stringify(billData, null, 2));
    await createBill(billData);
  };

  return (
    <div>
      <PageHeader 
        title="Create New Bill" 
        icon={<Receipt size={24} />}
      >
        <p>Create a new bill for a patient.</p>
      </PageHeader>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit}>
              {/* Patient Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Patient Information</h3>
                {selectedPatient ? (
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{selectedPatient.name}</p>
                      <p className="text-sm text-gray-500">
                        {selectedPatient.age} years, {selectedPatient.gender}
                      </p>
                      <p className="text-sm text-gray-500">{selectedPatient.phone}</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(null);
                        setShowPatientSearch(true);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="mb-4">
                    {showPatientSearch && (
                      <div>
                        <div className="relative mb-3">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            placeholder="Search patients by name or phone..."
                            value={patientSearchTerm}
                            onChange={(e) => setPatientSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto border rounded-md">
                          {filteredPatients.length === 0 ? (
                            <div className="p-3 text-center text-gray-500">
                              No patients found
                            </div>
                          ) : (
                            filteredPatients.map((patient: Patient) => (
                              <div 
                                key={patient.id}
                                className="p-3 border-b hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                onClick={() => selectPatient(patient)}
                              >
                                <div>
                                  <p className="font-medium">{patient.name}</p>
                                  <p className="text-sm text-gray-500">{patient.phone}</p>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {patient.age} years, {patient.gender}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Bill Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Bill Items</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={<Plus size={18} />}
                    onClick={addBillItem}
                  >
                    Add Service
                  </Button>
                </div>
                {billItems.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <p className="text-gray-500 mb-2">No services added yet</p>
                    <Button
                      type="button"
                      variant="outline"
                      icon={<Plus size={18} />}
                      onClick={addBillItem}
                    >
                      Add Service
                    </Button>
                  </div>
                ) : (
                  <div className="mb-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                            Total
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {billItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <select
                                value={item.serviceId}
                                onChange={(e) => updateBillItem(item.id, 'serviceId', parseInt(e.target.value))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value={0}>Select service</option>
                                {services.map((service: Service) => (
                                  <option key={service.id} value={service.id}>
                                    {service.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateBillItem(item.id, 'quantity', parseInt(e.target.value))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <span className="mr-1">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.price}
                                  onChange={(e) => updateBillItem(item.id, 'price', parseFloat(e.target.value))}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  readOnly={item.serviceId !== 0}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium">₹{item.total.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeBillItem(item.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/billing')}
                  icon={<X size={18} />}
                >
                  Cancel
                </Button>
                {createError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
                    {createError}
                  </div>
                )}
                <Button
                  type="submit"
                  icon={<Save size={18} />}
                  disabled={!selectedPatient || billItems.length === 0 || createLoading}
                  loading={createLoading}
                >
                  Create Bill
                </Button>
              </div>
            </form>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-lg font-medium mb-4">Bill Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600">Discount:</span>
                  <span>₹{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex mb-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                    className="w-28 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm mr-2"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="amount">Amount</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm mr-2"
                  />
                  {discountType === 'percentage' && <span className="text-gray-500 text-sm mt-2">%</span>}
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">Billing Notes</h4>
              <textarea
                placeholder="Add any notes or payment instructions..."
                rows={3}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateBill;