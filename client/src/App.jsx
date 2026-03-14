import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Events from './pages/Events';
import PastEvents from './pages/PastEvents';
import EventDetail from './pages/EventDetail';
import Calendar from './pages/Calendar';
import Propose from './pages/Propose';
import Polls from './pages/Polls';
import Newsletter from './pages/Newsletter';
import Join from './pages/Join';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="events" element={<Events />} />
          <Route path="past-events" element={<PastEvents />} />
          <Route path="event/:id" element={<EventDetail />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="propose" element={<Propose />} />
          <Route path="polls" element={<Polls />} />
          <Route path="newsletter" element={<Newsletter />} />
          <Route path="join" element={<Join />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
