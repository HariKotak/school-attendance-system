import { useEffect, useState } from "react";
import api from "../api/api";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    roll_no: "",
    student_name: "",
    class_name: "",
    identifier_code: "",
    parent_name: "",
    contact: "",
    address: ""
  });

  const loadStudents = async () => {
    const res = await api.get("/students/");
    setStudents(res.data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const addStudent = async () => {
    await api.post("/students/", form);
    setForm({});
    loadStudents();
  };

  const deleteStudent = async (roll) => {
    if (window.confirm("Delete student?")) {
      await api.delete(`/students/${roll}/`);
      loadStudents();
    }
  };

  return (
    <div className="container-fluid mt-4 px-4">

      <div className="card mb-4">
        <div className="card-header fw-bold">Add Student</div>
        <div className="card-body row g-2">
          {Object.keys(form).map(key => (
            <div className="col-md-4" key={key}>
              <input
                className="form-control"
                placeholder={key.replace("_", " ")}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="col-md-12">
            <button className="btn btn-primary" onClick={addStudent}>
              Add Student
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header fw-bold">Students List</div>
        <table className="table table-bordered mb-0">
          <thead className="table-dark">
            <tr>
              <th>Roll</th>
              <th>Name</th>
              <th>Class</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.roll_no}>
                <td>{s.roll_no}</td>
                <td>{s.student_name}</td>
                <td>{s.class_name}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteStudent(s.roll_no)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
