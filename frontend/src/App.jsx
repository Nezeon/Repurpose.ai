import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout } from './layouts';
import {
  Chat,
  Dashboard,
  Search,
  Results,
  History,
  SavedOpportunities,
  Integrations,
  Settings,
  Login,
} from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Main app routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<Chat />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="search" element={<Search />} />
          <Route path="results" element={<Results />} />
          <Route path="results/:drugName" element={<Results />} />
          <Route path="history" element={<History />} />
          <Route path="saved" element={<SavedOpportunities />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
