import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/patients/PatientList';
import AddPatient from './pages/patients/AddPatient';
import PatientProfile from './pages/patients/PatientProfile';
import CreateBill from './pages/billing/CreateBill';
import BillList from './pages/billing/BillList';
import ServicesList from './pages/services/ServicesList';
import ManageService from './pages/services/ManageService';
import DailyReports from './pages/reports/DailyReports';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="patients">
          <Route index element={<PatientList />} />
          <Route path="add" element={<AddPatient />} />
          <Route path=":id" element={<PatientProfile />} />
        </Route>
        <Route path="billing">
          <Route index element={<BillList />} />
          <Route path="create" element={<CreateBill />} />
        </Route>
        <Route path="services">
          <Route index element={<ServicesList />} />
          <Route path="add" element={<ManageService />} />
          <Route path="edit/:id" element={<ManageService />} />
        </Route>
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DailyReports />
          </ProtectedRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes; 