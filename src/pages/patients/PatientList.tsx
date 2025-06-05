import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Edit, Trash2, ChevronDown, ChevronUp, Download, Filter, AlertTriangle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useApi } from '../../hooks/useApi';
import { patientApi, type Patient } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PatientList: React.FC = () => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    ageRange: '',
  });
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  
  const { data, loading, error, execute } = useApi<Patient[]>(patientApi.getAll);
  // Debug: log the data received from API
  console.log('patients data:', data);
  const patients = Array.isArray(data)
    ? data
    : (data && Array.isArray((data as any).results))
      ? (data as any).results
      : [];
  
  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const filteredPatients = patients
    // Apply search filter
    .filter((patient: Patient) => 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
    )
    // Apply additional filters
    .filter((patient: Patient) => {
      // Filter by gender if selected
      if (filters.gender && patient.gender !== filters.gender) {
        return false;
      }
      
      // Filter by age range if selected
      if (filters.ageRange) {
        const [min, max] = filters.ageRange.split('-').map(Number);
        if (patient.age < min || (max && patient.age > max)) {
          return false;
        }
      }
      
      return true;
    })
    // Apply sorting
    .sort((a: Patient, b: Patient) => {
      if (!sortField) return 0;
      
      const fieldA = a[sortField as keyof Patient];
      const fieldB = b[sortField as keyof Patient];
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      
      // For numeric fields
      if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        return sortDirection === 'asc' 
          ? fieldA - fieldB
          : fieldB - fieldA;
      }
      
      return 0;
    });
  
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };
  
  const openDeleteModal = (patient: Patient) => {
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setPatientToDelete(null);
  };
  
  const handleDelete = async () => {
    if (!patientToDelete) return;
    
    try {
      await patientApi.delete(patientToDelete.id);
      toast.success('Patient deleted successfully');
      execute(); // Refresh the list
      closeDeleteModal();
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      // Display a more specific error message if available from the API
      const errorMessage = error.response?.data?.error || 'Failed to delete patient';
      toast.error(errorMessage);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Age', 'Gender', 'Phone', 'Email', 'Address', 'Last Visit'],
      ...patients.map((patient: Patient) => [
        patient.name,
        patient.age,
        patient.gender,
        patient.phone,
        patient.email || '',
        patient.address,
        new Date(patient.last_visit).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleFilter = () => {
    setShowFilter(!showFilter);
  };

  return (
    <div>
      <PageHeader 
        title="Patient Management" 
        actionLabel="Add New Patient" 
        actionPath="/patients/add"
        icon={<Users size={24} />}
      >
        <p>View and manage all patients in the system.</p>
      </PageHeader>
      
      <Card>
        <div className="mb-4 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} icon={<Download size={16} />}>
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleFilter} icon={<Filter size={16} />}>
              Filter
            </Button>
          </div>
        </div>
        
        {showFilter && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Range</label>
                <select
                  value={filters.ageRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, ageRange: e.target.value }))}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">All</option>
                  <option value="0-18">0-18 years</option>
                  <option value="19-30">19-30 years</option>
                  <option value="31-50">31-50 years</option>
                  <option value="51-100">51+ years</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <p className="text-gray-500">Loading patients...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-red-500">Error loading patients</p>
          </div>
        ) : (
          <Table
            headers={[
              "Name",
              "Age",
              "Gender",
              "Phone",
              "Last Visit",
              "Actions"
            ]}
          >
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  No patients found matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient: Patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Link to={`/patients/${patient.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {patient.name}
                      </Link>
                      <button 
                        className="ml-2 focus:outline-none"
                        onClick={() => handleSort('name')}
                      >
                        <SortIcon field="name" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {patient.age}
                      <button 
                        className="ml-2 focus:outline-none"
                        onClick={() => handleSort('age')}
                      >
                        <SortIcon field="age" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant={patient.gender === 'Male' ? 'info' : 'secondary'}
                    >
                      {patient.gender}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(patient.last_visit)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Link to={`/patients/${patient.id}`}>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          icon={<Edit size={16} />}
                        >
                          Edit
                        </Button>
                      </Link>
                      {/* Only show delete button for admin users */}
                      {isAdmin() && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          icon={<Trash2 size={16} />}
                          onClick={() => openDeleteModal(patient)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
        
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredPatients.length} of {patients.length} patients
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
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirm Delete"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeDeleteModal}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Delete Patient Record</h3>
          {patientToDelete && (
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-semibold">{patientToDelete.name}</span>?
            </p>
          )}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left w-full">
            <p className="text-sm text-yellow-700">
              <strong>Warning:</strong> This will permanently delete the patient record and all associated data including:
            </p>
            <ul className="list-disc ml-5 mt-2 text-sm text-yellow-700">
              <li>All billing records</li>
              <li>Medical history</li>
              <li>Treatment records</li>
              <li>Medical reports</li>
            </ul>
            <p className="text-sm text-yellow-700 mt-2">This action cannot be undone.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default PatientList;