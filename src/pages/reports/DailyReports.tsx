import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Calendar, Download, Printer } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import PageHeader from '../../components/ui/PageHeader';
import { useApi } from '../../hooks/useApi';
import { billingApi, type DailyReportData } from '../../services/api';
import { toast } from 'react-hot-toast';

const DailyReports: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  
  const { data: reportData, loading, error, execute: fetchDailyReport } = 
    useApi<DailyReportData>(() => billingApi.getDailyReport(selectedDate));
  
  // Fetch report data when date changes
  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate]);
  
  // Get bills from the report data
  const filteredBills = reportData?.bills || [];
  
  // Get summary data
  const totalAmount = reportData?.summary?.total_amount || 0;
  const billCount = reportData?.summary?.bill_count || 0;
  const averageAmount = reportData?.summary?.average_amount || 0;
  const highestAmount = reportData?.summary?.highest_amount || 0;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleExportCSV = () => {
    if (!reportData || !reportData.bills.length) {
      toast.error('No data to export');
      return;
    }
    
    const csvContent = [
      ['Bill #', 'Time', 'Patient', 'Amount', 'Status'],
      ...reportData.bills.map(bill => [
        bill.bill_number,
        new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        bill.patient_name,
        bill.grand_total.toString(),
        bill.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `daily_report_${selectedDate}.csv`;
    link.click();
    toast.success('Report exported successfully');
  };
  
  const handlePrint = () => {
    if (!reportData || !reportData.bills.length) {
      toast.error('No data to print');
      return;
    }
    
    const printContent = generatePrintContent();
    
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
        }, 500);
      }
    }
  };
  
  // Function to generate HTML content for printing
  const generatePrintContent = () => {
    if (!reportData) return '';
    
    const formattedDate = formatDate(selectedDate);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daily Report - ${formattedDate}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .report-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .report-header h1 {
            margin: 0;
            color: #2563eb;
          }
          .report-date {
            font-size: 18px;
            margin: 10px 0 30px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            background-color: #fff;
          }
          .summary-card h3 {
            margin: 5px 0;
            font-size: 24px;
          }
          .summary-card p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
          }
          th {
            background-color: #f9fafb;
            font-weight: 600;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
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
        <div class="report-header">
          <h1>ClinicPro</h1>
          <p>Daily Financial Report</p>
          <div class="report-date">Date: ${formattedDate}</div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card">
            <p>Total Revenue</p>
            <h3>₹${reportData.summary.total_amount.toFixed(2)}</h3>
            <p>From ${reportData.summary.bill_count} bills</p>
          </div>
          
          <div class="summary-card">
            <p>Average Bill Amount</p>
            <h3>₹${reportData.summary.average_amount.toFixed(2)}</h3>
            <p>Total Bills: ${reportData.summary.bill_count}</p>
          </div>
          
          <div class="summary-card">
            <p>Highest Bill Amount</p>
            <h3>₹${reportData.summary.highest_amount.toFixed(2)}</h3>
            <p>Time Range: Today</p>
          </div>
        </div>
        
        <h2>Bills for ${formattedDate}</h2>
        
        <table>
          <thead>
            <tr>
              <th>Bill #</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.bills.map(bill => `
              <tr>
                <td>${bill.bill_number}</td>
                <td>${new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${bill.patient_name}</td>
                <td>₹${(typeof bill.grand_total === 'number' ? bill.grand_total : Number(bill.grand_total)).toFixed(2)}</td>
                <td>${bill.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Report generated on ${new Date().toLocaleString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p>ClinicPro - Clinic Management System</p>
        </div>
      </body>
      </html>
    `;
  };
  
  return (
    <div>
      <PageHeader 
        title="Daily Reports" 
        icon={<BarChart3 size={24} />}
      >
        <p>View financial summaries and transaction details by date.</p>
      </PageHeader>
      
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex gap-2 ml-auto">
          <Button 
            variant="outline" 
            size="sm"
            icon={<Download size={16} />}
            onClick={handleExportCSV}
            disabled={loading || !filteredBills.length}
          >
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            icon={<Printer size={16} />}
            onClick={handlePrint}
            disabled={loading || !filteredBills.length}
          >
            Print Report
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold mt-1">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : `₹${totalAmount.toFixed(2)}`}
              </h3>
            </div>
            <div className="p-2 rounded-full bg-blue-50 text-blue-600">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bills Generated</span>
              <span className="font-medium">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : billCount}
              </span>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Bill Amount</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : `₹${averageAmount.toFixed(2)}`}
              </h3>
            </div>
            <div className="p-2 rounded-full bg-green-50 text-green-600">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Bills</span>
              <span className="font-medium">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : billCount}
              </span>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Highest Bill Amount</p>
              <h3 className="text-2xl font-bold mt-1 text-yellow-600">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : `₹${highestAmount.toFixed(2)}`}
              </h3>
            </div>
            <div className="p-2 rounded-full bg-yellow-50 text-yellow-600">
              <BarChart3 size={24} />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Time Range</span>
              <span className="font-medium">Today</span>
            </div>
          </div>
        </Card>
      </div>
      
      <Card title={`Bills for ${formatDate(selectedDate)}`}>
        {loading ? (
          <div className="py-8 text-center animate-pulse">
            <p className="text-gray-500">Loading report data...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-500">Error loading report: {error?.toString() || 'Unknown error'}</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">No bills found for the selected date.</p>
          </div>
        ) : (
          <Table
            headers={['Bill #', 'Time', 'Patient', 'Amount', 'Actions']}
          >
            {filteredBills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {bill.bill_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(bill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{bill.patient_name}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">₹{(typeof bill.grand_total === 'number' ? bill.grand_total : Number(bill.grand_total)).toFixed(2)}</td>
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
      </Card>
      {/* Hidden iframe for printing */}
      <iframe 
        ref={printFrameRef}
        style={{ display: 'none' }} 
        title="Print Frame"
      />
    </div>
  );
};

export default DailyReports;