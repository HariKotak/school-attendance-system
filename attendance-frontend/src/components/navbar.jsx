import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
      <span className="navbar-brand fw-bold">School Attendance</span>

      <div className="navbar-nav">
        <Link className="nav-link" to="/">Students</Link>
        <Link className="nav-link" to="/attendance">Attendance</Link>
        <Link className="nav-link" to="/absent">Absent List</Link>
      </div>
    </nav>
  );
}
