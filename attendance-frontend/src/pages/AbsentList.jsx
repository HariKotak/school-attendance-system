import { useEffect, useState } from "react";
import api from "../api/api";

export default function AbsentList() {
  const [absent, setAbsent] = useState([]);

  useEffect(() => {
    api.get("/attendance/absent")
      .then(res => setAbsent(res.data));
  }, []);

  const sendWhatsApp = (phone, msg) => {
    window.open(
      `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`
    );
  };

  return (
    <div className="container-fluid mt-4 px-4">
      <div className="card">
        <div className="card-header fw-bold">Absent Students</div>
        <table className="table table-bordered mb-0">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {absent.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center">
                  No absentees today 🎉
                </td>
              </tr>
            ) : (
              absent.map(a => (
                <tr key={a.roll_no}>
                  <td>{a.student_name}</td>
                  <td>{a.contact}</td>
                  <td>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => sendWhatsApp(a.contact, a.message)}
                    >
                      Send
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
