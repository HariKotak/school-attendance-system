import { useEffect, useState } from "react";
import api from "../api/api";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [statusMessage, setStatusMessage] = useState({});
  const [form, setForm] = useState({
    roll_no: "",
    student_name: "",
    class_name: "",
    parent_name: "",
    contact: "",
    address: ""
  });

  const loadStudents = async () => {
    try {
      const res = await api.get("/students/");
      setStudents(res.data);
    } catch (error) {
      console.error("Failed to load students:", error);
    }
  };

  const loadDevices = async () => {
    try {
      const res = await api.get("/devices/");
      setDevices(res.data);
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
  };

  useEffect(() => {
    loadStudents();
    loadDevices();
    
    const interval = setInterval(loadDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const addStudent = async () => {
    if (!form.roll_no || !form.student_name || !form.class_name || !form.parent_name || !form.contact) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      await api.post("/students/", form);
      setForm({
        roll_no: "",
        student_name: "",
        class_name: "",
        parent_name: "",
        contact: "",
        address: ""
      });
      loadStudents();
      alert("Student added successfully!");
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      alert("Error: " + errorMsg);
    }
  };

  const deleteStudent = async (roll) => {
    if (window.confirm("Delete this student?")) {
      try {
        await api.delete(`/students/${roll}/`);
        loadStudents();
        alert("Student deleted");
      } catch (error) {
        alert("Error deleting student");
      }
    }
  };

  const enrollFingerprint = async (rollNo) => {
    setStatusMessage(prev => ({ ...prev, [rollNo]: "📡 Sending enrollment command..." }));
    
    try {
      const response = await api.post("/student/enroll/", {
        roll_no: rollNo,
        device_id: "FP001"
      });
      
      setStatusMessage(prev => ({
        ...prev,
        [rollNo]: `👆 ${response.data.instruction} (ID: ${response.data.fingerprint_id})`
      }));
      
      pollCommandStatus(rollNo, response.data.command_id);
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setStatusMessage(prev => ({ ...prev, [rollNo]: `❌ ${errorMsg}` }));
      setTimeout(() => {
        setStatusMessage(prev => ({ ...prev, [rollNo]: "" }));
      }, 5000);
    }
  };

  const deleteFingerprint = async (rollNo) => {
    if (!window.confirm("Delete fingerprint for this student?")) return;
    
    setStatusMessage(prev => ({ ...prev, [rollNo]: "🗑️ Sending deletion..." }));
    
    try {
      const response = await api.post("/student/delete-fingerprint/", {
        roll_no: rollNo,
        device_id: "FP001"
      });
      
      setStatusMessage(prev => ({ ...prev, [rollNo]: "⏳ Deleting..." }));
      pollCommandStatus(rollNo, response.data.command_id);
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setStatusMessage(prev => ({ ...prev, [rollNo]: `❌ ${errorMsg}` }));
      setTimeout(() => {
        setStatusMessage(prev => ({ ...prev, [rollNo]: "" }));
      }, 5000);
    }
  };

  const pollCommandStatus = (rollNo, commandId) => {
    let attempts = 0;
    const maxAttempts = 60;
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await api.get(`/command/${commandId}/`);
        const data = response.data;
        
        if (data.status === 'completed') {
          clearInterval(interval);
          setStatusMessage(prev => ({
            ...prev,
            [rollNo]: `✅ Success! ${data.message}`
          }));
          
          setTimeout(() => {
            loadStudents();
            setStatusMessage(prev => ({ ...prev, [rollNo]: "" }));
          }, 2000);
          
        } else if (data.status === 'failed' || data.status === 'expired') {
          clearInterval(interval);
          setStatusMessage(prev => ({
            ...prev,
            [rollNo]: `❌ Failed: ${data.message}`
          }));
          
          setTimeout(() => {
            setStatusMessage(prev => ({ ...prev, [rollNo]: "" }));
          }, 5000);
          
        } else if (data.status === 'in_progress') {
          setStatusMessage(prev => ({
            ...prev,
            [rollNo]: `⏳ ${data.message || 'Processing...'}`
          }));
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setStatusMessage(prev => ({
            ...prev,
            [rollNo]: "⚠️ Timeout. Please refresh."
          }));
        }
        
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 2000);
  };

  return (
    <div className="container-fluid mt-4 px-4">
      {/* Device Status */}
      {devices.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">📱 Fingerprint Devices</h5>
          </div>
          <div className="card-body">
            {devices.map(device => (
              <div key={device.device_id} className="d-flex align-items-center gap-3 mb-2 p-2 bg-light rounded">
                <strong>{device.name}</strong>
                <span className={`badge ${device.is_online ? 'bg-success' : 'bg-danger'}`}>
                  {device.is_online ? '🟢 Online' : '🔴 Offline'}
                </span>
                <span className="text-muted small">Mode: {device.current_mode}</span>
                {device.last_seen && (
                  <span className="text-muted small ms-auto">
                    Last: {new Date(device.last_seen).toLocaleTimeString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Student Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">➕ Add New Student</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="number"
                className="form-control"
                placeholder="Roll Number"
                value={form.roll_no}
                onChange={e => setForm({ ...form, roll_no: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Student Name"
                value={form.student_name}
                onChange={e => setForm({ ...form, student_name: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Class"
                value={form.class_name}
                onChange={e => setForm({ ...form, class_name: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Parent Name"
                value={form.parent_name}
                onChange={e => setForm({ ...form, parent_name: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Contact Number"
                value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Address (Optional)"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" onClick={addStudent}>
                Add Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">👥 Students List ({students.length})</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover table-striped mb-0">
            <thead className="table-dark">
              <tr>
                <th>Roll No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Fingerprint</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-4">
                    No students found. Add your first student above!
                  </td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.roll_no}>
                    <td className="fw-bold">{s.roll_no}</td>
                    <td>{s.student_name}</td>
                    <td><span className="badge bg-info">{s.class_name}</span></td>
                    <td>
                      {s.fingerprint_enrolled ? (
                        <span className="badge bg-success">
                          ✓ ID: {s.fingerprint_id}
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark">
                          ✗ Not Enrolled
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group">
                        {s.fingerprint_enrolled ? (
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deleteFingerprint(s.roll_no)}
                            title="Remove Fingerprint"
                          >
                            🗑️ Remove FP
                          </button>
                        ) : (
                          <button
                            className="btn btn-outline-success"
                            onClick={() => enrollFingerprint(s.roll_no)}
                            title="Enroll Fingerprint"
                          >
                            👆 Enroll FP
                          </button>
                        )}
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => deleteStudent(s.roll_no)}
                          title="Delete Student"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      
                      {statusMessage[s.roll_no] && (
                        <div className="alert alert-info alert-sm mt-2 mb-0 p-2 small">
                          {statusMessage[s.roll_no]}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}