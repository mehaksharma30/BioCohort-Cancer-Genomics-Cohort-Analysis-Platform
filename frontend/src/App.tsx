import { Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Ingestion from './pages/Ingestion';
import CohortBuilder from './pages/CohortBuilder';
import CohortDetail from './pages/CohortDetail';
import QualityReport from './pages/QualityReport';

export default function App() {
  return (
    <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingestion" element={<Ingestion />} />
          <Route path="/cohorts/new" element={<CohortBuilder />} />
          <Route path="/cohorts/:id" element={<CohortDetail />} />
          <Route path="/cohorts/:id/quality" element={<QualityReport />} />
        </Routes>
    </AppShell>
  );
}
