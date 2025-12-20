import { useState } from "react";
import api from "../api/api";

export default function Attendance() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const finalizeAttendance = async () => {
    if (!window.confirm("Mark all non-scanned students as absent for today?")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/attendance/finalize/");
      setMessage(`✅ ${response.data.message} (${response.data.date})`);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setMessage(`❌ Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid mt-4 px-4">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow">
            <div className="card-header bg-warning text-dark">
              <h4 className="mb-0">📋 Finalize Attendance</h4>
            </div>
            <div className="card-body text-center p-5">
              <div className="mb-4">
                <i className="bi bi-calendar-check" style={{ fontSize: "4rem", color: "#ffc107" }}></i>
              </div>
              
              <h5 className="mb-3">End of Day Attendance</h5>
              <p className="text-muted mb-4">
                This will mark all students who haven't scanned their fingerprint today as <strong>absent</strong>.
                Make sure all present students have already scanned before finalizing.
              </p>

              <button
                className="btn btn-warning btn-lg w-100 mb-3"
                onClick={finalizeAttendance}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Finalizing...
                  </>
                ) : (
                  <>
                    ⚠️ Finalize Today's Attendance
                  </>
                )}
              </button>

              {message && (
                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} mt-3`}>
                  {message}
                </div>
              )}

              <div className="mt-4 text-start">
                <small className="text-muted">
                  <strong>Note:</strong>
                  <ul className="mt-2">
                    <li>Only finalize once per day</li>
                    <li>Cannot be undone</li>
                    <li>Updates total attendance records</li>
                  </ul>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}