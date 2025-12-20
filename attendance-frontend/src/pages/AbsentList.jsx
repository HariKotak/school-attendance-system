import { useEffect, useState } from "react";
import api from "../api/api";

export default function AbsentList() {
  const [absent, setAbsent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const loadAbsentees = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/absent/?date=${selectedDate}`);
      setAbsent(res.data);
    } catch (error) {
      console.error("Failed to load absentees:", error);
      alert("Error loading absent students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAbsentees();
  }, [selectedDate]);

  const sendWhatsApp = (phone, msg) => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(
      `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const sendAllMessages = () => {
    if (absent.length === 0) {
      alert("No absent students to message");
      return;
    }

    if (!window.confirm(`Send WhatsApp messages to ${absent.length} parents?`)) {
      return;
    }

    absent.forEach((student, index) => {
      setTimeout(() => {
        sendWhatsApp(student.contact, student.message);
      }, index * 1000); // Delay each message by 1 second
    });
  };

  return (
    <div className="container-fluid mt-4 px-4">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">📊 Absent Students</h5>
            <div className="d-flex gap-3 align-items-center">
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              {absent.length > 0 && (
                <button
                  className="btn btn-success"
                  onClick={sendAllMessages}
                  title="Send WhatsApp to all parents"
                >
                  📱 Send All ({absent.length})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading absent students...</p>
            </div>
          ) : absent.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: "4rem" }}>🎉</div>
              <h4 className="mt-3">Perfect Attendance!</h4>
              <p className="text-muted">No students were absent on {selectedDate}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Contact</th>
                    <th>Attendance Stats</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {absent.map((student, index) => (
                    <tr key={student.roll_no}>
                      <td>{index + 1}</td>
                      <td className="fw-bold">{student.roll_no}</td>
                      <td>{student.student_name}</td>
                      <td>
                        <span className="badge bg-info">{student.class_name}</span>
                      </td>
                      <td>{student.contact}</td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          <span className="badge bg-success" title="Present Days">
                            ✓ {student.present_days}
                          </span>
                          <span className="badge bg-danger" title="Absent Days">
                            ✗ {student.absent_days}
                          </span>
                          {student.continuous_absent > 0 && (
                            <span className="badge bg-warning text-dark" title="Continuous Absent">
                              ⚠️ {student.continuous_absent} days
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => sendWhatsApp(student.contact, student.message)}
                          title="Send WhatsApp message to parent"
                        >
                          💬 WhatsApp
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {absent.length > 0 && (
          <div className="card-footer bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted">
                Total Absent: <strong>{absent.length}</strong> student{absent.length !== 1 ? 's' : ''}
              </span>
              <button className="btn btn-outline-primary btn-sm" onClick={loadAbsentees}>
                🔄 Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}