import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold" to="/">
          🎓 School Attendance System
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/') ? 'active fw-bold' : ''}`} 
                to="/"
              >
                👥 Students
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/attendance') ? 'active fw-bold' : ''}`} 
                to="/attendance"
              >
                📋 Finalize
              </Link>
            </li>
            <li className="nav-item">
              <Link 
                className={`nav-link ${isActive('/absent') ? 'active fw-bold' : ''}`} 
                to="/absent"
              >
                📊 Absent List
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}