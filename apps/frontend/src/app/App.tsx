import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SourcesPage } from '@/features/sources/components/SourcesPage';
import { AppShell } from './layout/AppShell';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />} />
        <Route path="/projects/:projectId/sources" element={<SourcesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
