import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Queue from './pages/Queue';
import Workday from './pages/Workday';
import Review from './pages/Review';
import Settings from './pages/Settings';
import './App.css';

function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Workday />} />
          <Route path="queue" element={<Queue />} />
          <Route path="review/:id" element={<Review />} />
          <Route path="review" element={<Review />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
