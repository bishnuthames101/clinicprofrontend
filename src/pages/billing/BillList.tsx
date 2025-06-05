import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Search, Download, Filter, Printer, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { useApi } from '../../hooks/useApi';
import { billingApi, type Bill } from '../../services/api';

const BillList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSearchTerm, setPrintSearchTerm] = useState('');
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<Bill | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: '',
    amountRange: ''
  });
  
  const { data: response, loading, error, execute: fetchBills } = useApi(billingApi.getAll);
  console.log('bills response:', response);
  const bills = Array.isArray(response)
    ? response
    : (response && Array.isArray((response as any).results))
      ? (response as any).results
      : [];
  
  useEffect(() => {
    fetchBills();
  }, []);
  
  const handleFilter = () => {
    setShowFilter(!showFilter);
  };
  
  const filteredBills = bills
    // Apply search filter
    .filter((bill: Bill) => 
      bill.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.bill_number.includes(searchTerm)
    )
    // Apply additional filters
    .filter((bill: Bill) => {
      
     
      
      // Filter by date range if selected
      if (filters.dateRange) {
        const today = new Date();
        const billDate = new Date(bill.date);
        
        switch(filters.dateRange) {
          case 'today':
            if (billDate.toDateString() !== today.toDateString()) {
              return false;
            }
            break;
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            if (billDate < weekAgo) {
              return false;
            }
            break;
          case 'month':
            const monthAgo = new Date();
            monthAgo.setMonth(today.getMonth() - 1);
            if (billDate < monthAgo) {
              return false;
            }
            break;
          case 'year':
            const yearAgo = new Date();
            yearAgo.setFullYear(today.getFullYear() - 1);
            if (billDate < yearAgo) {
              return false;
            }
            break;
        }
      }
      
      // Filter by amount range if selected
      if (filters.amountRange) {
        const amount = parseFloat(String(bill.grand_total));
        const [min, max] = filters.amountRange.split('-').map(Number);
        
        if (amount < min || (max && amount > max)) {
          return false;
        }
      }
      
      return true;
    });
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div>
      <PageHeader 
        title="Billing" 
        actionLabel="Create New Bill" 
        actionPath="/billing/create"
        icon={<Receipt size={24} />}
      >
        <p>Manage patient bills and invoices.</p>
      </PageHeader>
      
      <Card>
        <div className="mb-4 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              icon={<Filter size={16} />}
              onClick={handleFilter}
            >
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              icon={<Printer size={16} />}
              onClick={() => setShowPrintModal(true)}
            >
              Print
            </Button>
          </div>
        </div>
        
        {showFilter && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow border mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
                <select
                  value={filters.amountRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountRange: e.target.value }))}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">All</option>
                  <option value="0-1000">₹0 - ₹1,000</option>
                  <option value="1000-5000">₹1,000 - ₹5,000</option>
                  <option value="5000-10000">₹5,000 - ₹10,000</option>
                  <option value="10000-50000">₹10,000 - ₹50,000</option>
                  <option value="50000-">Above ₹50,000</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                size="sm"
                onClick={() => setFilters({ status: '', dateRange: '', amountRange: '' })}
                variant="outline"
                className="mr-2"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <p className="text-gray-500">Loading bills...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-red-500">Error loading bills</p>
          </div>
        ) : (
          <Table
            headers={['Bill Number', 'Date', 'Patient', 'Amount', 'Actions']}
          >
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No bills found matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredBills.map((bill: Bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {bill.bill_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(bill.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/patients/${bill.patient}`} className="text-blue-600 hover:text-blue-800">
                      {bill.patient_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">₹{parseFloat(String(bill.grand_total)).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        icon={<Download size={16} />}
                        onClick={() => billingApi.download(bill.id)}
                      >
                        Download
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
            Showing {filteredBills.length} of {bills.length} bills
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

      {/* Print Bill Selection Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select Bill to Print</h2>
              <button 
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintSearchTerm('');
                  setSelectedBillForPrint(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by bill number or patient name..."
                  value={printSearchTerm}
                  onChange={(e) => setPrintSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mb-4 max-h-[50vh] overflow-y-auto border rounded-md">
              <Table
                headers={['Bill Number', 'Date', 'Patient', 'Amount', 'Action']}
              >
                {bills
                  .filter((bill: Bill) => 
                    bill.bill_number.toLowerCase().includes(printSearchTerm.toLowerCase()) ||
                    bill.patient_name.toLowerCase().includes(printSearchTerm.toLowerCase())
                  )
                  .slice(0, 10) // Limit to 10 results for better performance
                  .map((bill: Bill) => (
                    <tr key={bill.id} className={`hover:bg-gray-50 ${selectedBillForPrint?.id === bill.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {bill.bill_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(bill.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{bill.patient_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">₹{parseFloat(String(bill.grand_total)).toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedBillForPrint(bill)}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))
                }
              </Table>
              {bills.filter((bill: Bill) => 
                bill.bill_number.toLowerCase().includes(printSearchTerm.toLowerCase()) ||
                bill.patient_name.toLowerCase().includes(printSearchTerm.toLowerCase())
              ).length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  No bills found matching your search criteria.
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPrintModal(false);
                  setPrintSearchTerm('');
                  setSelectedBillForPrint(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                disabled={!selectedBillForPrint}
                onClick={() => handlePrintBill(selectedBillForPrint?.id)}
              >
                Print Selected Bill
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden iframe for printing */}
      <iframe 
        ref={printFrameRef}
        style={{ display: 'none' }} 
        title="Print Frame"
      />
    </div>
  );

  // Function to handle printing a bill
  async function handlePrintBill(billId?: number) {
    if (!billId) return;
    
    try {
      // Get the bill data
      const response = await billingApi.getById(billId);
      const bill = response.data;
      
      // Create print content
      const printContent = generatePrintContent(bill);
      
      // Load content into iframe and print
      const iframe = printFrameRef.current;
      if (iframe) {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(printContent);
          iframeDoc.close();
          
          // Wait for content to load
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setShowPrintModal(false);
            setPrintSearchTerm('');
            setSelectedBillForPrint(null);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error printing bill:', error);
      alert('Failed to print bill. Please try again.');
    }
  }
  
  // Function to generate HTML content for printing
  function generatePrintContent(bill: Bill) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill #${bill.bill_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .invoice-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .invoice-header h1 {
            margin: 0;
            color: #2563eb;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .invoice-details div {
            flex: 1;
          }
          .invoice-id {
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            text-align: left;
          }
          th {
            background-color: #f8fafc;
          }
          .total-row td {
            border-top: 2px solid #333;
            font-weight: bold;
          }
          .notes {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8fafc;
            border-radius: 5px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>ClinicPro</h1>
          <p>Invoice</p>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>Bill To:</h3>
            <p>
              <strong>${bill.patient_name}</strong><br>
              Patient ID: ${bill.patient}
            </p>
          </div>
          <div class="invoice-id">
            <h2>Invoice #${bill.bill_number}</h2>
            <p>Date: ${new Date(bill.date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
            <p>Status: ${bill.status}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items.map(item => `
              <tr>
                <td>${item.service_name}</td>
                <td>${item.quantity}</td>
                <td>₹${parseFloat(String(item.price)).toFixed(2)}</td>
                <td>₹${parseFloat(String(item.total)).toFixed(2)}</td>
              </tr>
            `).join('')}
            
            <tr>
              <td colspan="3" style="text-align: right;">Subtotal:</td>
              <td>₹${(parseFloat(String(bill.grand_total)) + parseFloat(String(bill.discount_amount))).toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right;">Discount (${bill.discount_type === 'percentage' ? bill.discount_value + '%' : 'Flat'}):</td>
              <td>₹${parseFloat(String(bill.discount_amount)).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Grand Total:</td>
              <td>₹${parseFloat(String(bill.grand_total)).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        ${bill.notes ? `
          <div class="notes">
            <h3>Notes:</h3>
            <p>${bill.notes}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Thank you for choosing ClinicPro for your healthcare needs.</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;
  }
};

export default BillList;