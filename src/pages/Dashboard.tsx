import React, { useEffect } from 'react';
import { Users, Receipt, DollarSign, Activity, TrendingUp } from 'lucide-react';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { useApi } from '../hooks/useApi';
import { dashboardApi, type DashboardData } from '../services/api';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp = true }) => (
  <Card className="flex flex-col">
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div className="p-2 rounded-full bg-blue-50 text-blue-600">
        {icon}
      </div>
    </div>
    {trend && (
      <div className={`flex items-center text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
        <span>{trend}</span>
      </div>
    )}
  </Card>
);

const Dashboard: React.FC = () => {
  const { data: dashboardData, loading, error, execute } = useApi<DashboardData>(dashboardApi.getData);
  
  useEffect(() => {
    // Add debugging logs
    console.log('Fetching dashboard data...');
    execute();
  }, []);
  
  // Debug logs
  useEffect(() => {
    console.log('Dashboard data:', dashboardData);
    console.log('Loading:', loading);
    console.log('Error:', error);
  }, [dashboardData, loading, error]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }
  
  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error loading dashboard data. Please try again.</div>
      </div>
    );
  }
  
  // Extract data from the dashboard response
  const {
    totalPatients,
    totalBills,
    totalRevenue,
    todayPatients,
    todayBills,
    todayRevenue,
    recentBills,
    recentPatients,
    dailyStats
  } = dashboardData;
  
  return (
    <div>
      <PageHeader title="Dashboard" icon={<Activity size={24} />}>
        <p>Welcome to your clinic dashboard. Here's an overview of today's metrics.</p>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Today's Revenue" 
          value={formatCurrency(todayRevenue)}
          icon={<DollarSign size={24} />}
          trend={`${todayBills} transactions today`}
        />
        <StatCard 
          title="Patients Today" 
          value={todayPatients}
          icon={<Users size={24} />}
          trend={`${((todayPatients / Math.max(totalPatients, 1)) * 100).toFixed(1)}% of total patients`}
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)}
          icon={<TrendingUp size={24} />}
          trend={`${totalBills} total bills`}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card title="Recent Patients">
          <div className="space-y-4">
            {recentPatients.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No recent patients</p>
            ) : (
              recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium">{patient.name}</h4>
                      <p className="text-xs text-gray-500">{patient.age} years, {patient.gender}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(patient.last_visit)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
        
        <Card title="Recent Bills">
          <div className="space-y-4">
            {recentBills.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No recent bills</p>
            ) : (
              recentBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
                      <Receipt size={16} />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium">{bill.bill_number}</h4>
                      <p className="text-xs text-gray-500">{bill.patient_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(bill.grand_total)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(bill.date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
      
      <Card title="Revenue Trend (Last 7 Days)">
        <div className="space-y-4">
          {dailyStats.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No data available</p>
          ) : (
            <div className="pt-4">
              <div className="flex justify-between items-center mb-6">
                {dailyStats.slice().reverse().map((day, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-2">{formatDate(day.date).split(',')[0]}</div>
                    <div 
                      className="bg-blue-500 rounded-t-md w-12"
                      style={{ 
                        height: `${Math.max(30, (day.revenue / Math.max(...dailyStats.map(d => d.revenue))) * 150)}px` 
                      }}
                    ></div>
                    <div className="text-xs font-medium mt-2">{formatCurrency(day.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;