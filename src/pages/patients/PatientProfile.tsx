import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  FileText, 
  Receipt, 
  Upload, 
  Download, 
  Edit, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  X,
  Save,
  Eye
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import EditPatientForm from '../../components/ui/EditPatientForm';
import { useApi } from '../../hooks/useApi';
import { patientApi, type Patient, type PatientDetails, type MedicalRecord, type Bill, type MedicalReport } from '../../services/api';
import { toast } from 'react-hot-toast';

// Separate component for the medical record form to prevent losing focus
interface MedicalRecordFormProps {
  onSubmit: (data: {
    diagnosis: string;
    prescription: string;
    description: string;
    doctor: string;
  }) => void;
  onCancel: () => void;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({ onSubmit, onCancel }) => {
  // Form state managed within this component
  const [formData, setFormData] = useState({
    description: '',
    diagnosis: '',
    prescription: '',
    doctor: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Prescription/Treatment</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              name="prescription"
              value={formData.prescription}
              onChange={handleChange}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            icon={<X size={16} />}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            icon={<Save size={16} />}
          >
            Save Record
          </Button>
        </div>
      </form>
    </Card>
  );
};

const PatientProfile: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [refetchKey, setRefetchKey] = useState(0);
  const { data: patientDetails, loading, error, execute } = useApi<PatientDetails>(() => patientApi.getDetails(parseInt(id)));
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showNewRecordForm, setShowNewRecordForm] = useState(false);
  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Medical Record Form is now handled by a dedicated component
  
  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchKey, id]);
  
  if (loading) return <div className="animate-pulse">Loading patient details...</div>;
  if (error) return <div className="text-red-500">Error loading patient details</div>;
  if (!patientDetails) return <div>Patient not found</div>;

  const handleEditSave = (updatedPatient: Partial<Patient>) => {
    setIsEditing(false);
    setRefetchKey((k) => k + 1);
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    setUploadingFile(true);
    const file = e.target.files[0];
    const fileType = file.type.startsWith('image/') ? 'image' : 'document';
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('type', fileType);
      formData.append('uploadedBy', 'Current User'); // In a real app, this would be the current user's name
      
      // Add the medical report via API
      const response = await fetch(`http://localhost:8000/api/patients/${id}/add_medical_report/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          // Don't set Content-Type here, it will be set automatically with the boundary for FormData
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      toast.success('Medical report uploaded successfully!');
      
      // Refresh patient details to show the new report
      setRefetchKey(prev => prev + 1);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };
  
  const handleNewRecordSubmit = async (formData: {
    diagnosis: string;
    prescription: string;
    description: string;
    doctor: string;
  }) => {
    try {
      // Call the API to add a medical record
      await patientApi.addMedicalRecord(parseInt(id), {
        diagnosis: formData.diagnosis,
        treatment: formData.prescription,
        notes: formData.description,
        doctor: formData.doctor
      });
      
      toast.success('Medical record added successfully!');
      setShowNewRecordForm(false);
      
      // Refresh patient details to show the new record
      setRefetchKey(prev => prev + 1);
    } catch (error) {
      console.error('Error adding medical record:', error);
      toast.error('Error adding medical record');
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleDeleteRecord = async (recordId: number) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) {
      return;
    }
    
    try {
      await patientApi.deleteMedicalRecord(parseInt(id), recordId);
      toast.success('Medical record deleted successfully!');
      setRefetchKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting medical record:', error);
      toast.error('Error deleting medical record');
    }
  };
  
  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('Are you sure you want to delete this medical report?')) {
      return;
    }
    
    try {
      await patientApi.deleteMedicalReport(parseInt(id), reportId);
      toast.success('Medical report deleted successfully!');
      setRefetchKey(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting medical report:', error);
      toast.error('Error deleting medical report');
    }
  };
  
  const MedicalRecordsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Medical Records</h3>
        <Button 
          size="sm"
          onClick={() => setShowNewRecordForm(true)}
        >
          Add New Record
        </Button>
      </div>
      
      {showNewRecordForm && (
        <MedicalRecordForm 
          onSubmit={handleNewRecordSubmit} 
          onCancel={() => setShowNewRecordForm(false)} 
        />
      )}
      
      {patientDetails.medicalRecords.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
          <FileText size={40} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No medical records found for this patient.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {patientDetails.medicalRecords.map((record: MedicalRecord) => (
            <Card key={record.id} className="border-l-4 border-l-blue-500">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center mb-3">
                    <Calendar size={16} className="text-gray-500 mr-2" />
                    <span className="text-sm font-medium">{formatDate(record.date)}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-sm text-gray-600">{record.doctor}</span>
                  </div>
                  <h4 className="font-medium mb-2">{record.diagnosis}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Treatment</p>
                      <p className="mt-1">{record.treatment}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Notes</p>
                      <p className="mt-1">{record.notes}</p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X size={16} />}
                  onClick={() => handleDeleteRecord(record.id)}
                  className="text-red-500 hover:text-red-700 h-8"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
  
  const BillingHistoryTab = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Billing History</h3>
        <Link to={`/billing/create?patientId=${id}`}>
          <Button size="sm">Create New Bill</Button>
        </Link>
      </div>
      
      {patientDetails.billingHistory.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
          <Receipt size={40} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No bills found for this patient.</p>
        </div>
      ) : (
        <Table headers={['Date', 'Services', 'Amount', 'Actions']}>
          {patientDetails.billingHistory.map((bill: Bill) => (
            <tr key={bill.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">{formatDate(bill.date)}</td>
              <td className="px-6 py-4">
                <ul className="list-disc list-inside text-sm">
                  {bill.items.map((item, idx) => (
                    <li key={idx}>
                      {item.service_name} ({item.quantity})
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium">₹{bill.grand_total}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Button 
                  variant="ghost" 
                  size="sm"
                  icon={<Download size={16} />}
                >
                  Download
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
  
  const MedicalReportsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Medical Reports</h3>
          <div>
            <input
              type="file"
              id="fileUpload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploadingFile}
            />
            <label htmlFor="fileUpload" className="cursor-pointer">
              <Button
                size="sm"
                icon={<Upload size={16} />}
                disabled={uploadingFile}
                type="button"
                onClick={() => document.getElementById('fileUpload')?.click()}
              >
                {uploadingFile ? 'Uploading...' : 'Upload Report'}
              </Button>
            </label>
          </div>
      </div>
      
      {viewingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Viewing Report</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={() => window.open(viewingReport, '_blank')}
                >
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X size={16} />}
                  onClick={() => setViewingReport(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            {viewingReport.toLowerCase().endsWith('.pdf') ? (
              <div className="bg-gray-100 rounded p-4 text-center">
                <p className="mb-4">PDF files may not display correctly in the preview. Please use the download button.</p>
                <iframe
                  src={viewingReport}
                  className="w-full h-[70vh] border-0"
                  title="PDF Viewer"
                />
              </div>
            ) : viewingReport.toLowerCase().match(/\.(jpe?g|png|gif|bmp|webp)$/i) ? (
              <div className="flex justify-center">
                <img 
                  src={viewingReport} 
                  alt="Medical Report" 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            ) : (
              <div className="bg-gray-100 rounded p-8 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">This file type may not preview correctly</p>
                <p className="text-gray-600 mb-4">Please use the download button to view this file.</p>
                <Button
                  variant="primary"
                  icon={<Download size={16} />}
                  onClick={() => window.open(viewingReport, '_blank')}
                >
                  Download File
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {patientDetails.medicalReports.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
          <FileText size={40} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No medical reports uploaded for this patient.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patientDetails.medicalReports.map((report: MedicalReport) => (
            <Card key={report.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{report.title}</h4>
                  <p className="text-sm text-gray-500">{formatDate(report.date)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{report.type}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<X size={16} />}
                    onClick={() => handleDeleteReport(report.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <User size={14} className="mr-1" />
                <span>Uploaded by {report.uploadedBy}</span>
              </div>
              <div className="mt-auto pt-2 border-t flex justify-end space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  icon={<Eye size={16} />}
                  onClick={() => setViewingReport(report.fileUrl)}
                  className="text-blue-600"
                >
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={() => window.open(report.fileUrl, '_blank')}
                  className="text-blue-600"
                >
                  Download
                </Button>
                
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
  
  const { patient } = patientDetails;
  
  return (
    <div>
      <PageHeader 
        title={`Patient: ${patient.name}`}
        icon={<User size={24} />}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          {isEditing ? (
            <EditPatientForm
              patient={patient}
              onSave={handleEditSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mb-3">
                  {patient.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold">{patient.name}</h3>
                <div className="flex mt-1 space-x-2">
                  <Badge>{patient.age} years</Badge>
                  <Badge variant="secondary">{patient.gender}</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Phone size={18} className="mt-0.5 mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p>{patient.phone}</p>
                  </div>
                </div>
                
                {patient.email && (
                  <div className="flex items-start">
                    <Mail size={18} className="mt-0.5 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p>{patient.email}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start">
                  <MapPin size={18} className="mt-0.5 mr-3 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p>{patient.address}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-500 mb-2">Medical History</p>
                  <p className="text-gray-700">{patient.medical_history || 'No medical history recorded.'}</p>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-500 mb-2">Last Visit</p>
                  <p>{formatDate(patient.last_visit)}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  icon={<Edit size={16} />}
                  fullWidth
                  onClick={() => setIsEditing(true)}
                >
                  Edit Patient Details
                </Button>
              </div>
            </>
          )}
        </Card>
        
        <div className="lg:col-span-2">
          <Tabs
            tabs={[
              { label: 'Medical Records', content: <MedicalRecordsTab /> },
              { label: 'Billing History', content: <BillingHistoryTab /> },
              { label: 'Medical Reports', content: <MedicalReportsTab /> }
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
