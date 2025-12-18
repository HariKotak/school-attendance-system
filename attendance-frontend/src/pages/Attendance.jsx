import api from "../api/api";

export default function Attendance() {
  const finalizeAttendance = async () => {
    if (window.confirm("Finalize attendance for today?")) {
      await api.post("/attendance/finalize/");
      alert("Attendance finalized");
    }
  };

  return (
    <div className="container-fluid mt-4 px-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4 text-center">
            <h4 className="mb-3">Finalize Attendance</h4>
            <button
              className="btn btn-warning w-100"
              onClick={finalizeAttendance}
            >
              Finalize Today Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
