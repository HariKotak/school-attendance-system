import { BrowserRouter, Routes, Route } from "react-router-dom";
import Students from "./pages/Students";
import Attendance from "./pages/Attendance";
import AbsentList from "./pages/AbsentList";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Students />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/absent" element={<AbsentList />} />
      </Routes>
    </BrowserRouter>
  );
}
