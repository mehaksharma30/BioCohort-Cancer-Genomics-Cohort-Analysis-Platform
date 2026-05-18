import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Ingestion from './pages/Ingestion';
import CohortBuilder from './pages/CohortBuilder';
import CohortDetail from './pages/CohortDetail';
import QualityReport from './pages/QualityReport';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingestion" element={<Ingestion />} />
          <Route path="/cohorts/new" element={<CohortBuilder />} />
          <Route path="/cohorts/:id" element={<CohortDetail />} />
          <Route path="/cohorts/:id/quality" element={<QualityReport />} />
        </Routes>
      </main>
    </div>
  );
}
