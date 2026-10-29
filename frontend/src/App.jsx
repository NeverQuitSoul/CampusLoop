
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import BrowseReports from "./pages/BrowseReports";
import ReportItem from "./pages/ReportItem";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <Link to="/" className="logo">
            CampusLoop
          </Link>

          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/reports">Browse Reports</Link>
            <Link to="/report">Report an Item</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reports" element={<BrowseReports />} />
          <Route path="/report" element={<ReportItem />} />
        </Routes>

        <footer>
          <p>CampusLoop © 2026 | Helping our campus reconnect</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
