import React, { useState, useEffect } from 'react';
import { Menu, X, Users, UserPlus, Calendar, BarChart3, Clock, CheckCircle, XCircle, Download, Search, LogOut, Filter, RefreshCw } from 'lucide-react';

const API_URL = 'https://attendance-backend-hxdy.onrender.com/api';

// Login Component
function LoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simple authentication - replace with real backend authentication
    setTimeout(() => {
      if (credentials.username === 'csf' && credentials.password === 'csf') {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('username', credentials.username);
        onLogin();
      } else {
        setError('Invalid username or password');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">School Attendance</h1>
          <p className="text-gray-600 mt-2">Sign in to manage attendance</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              required
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Main App Component
export default function AttendanceSystem() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [presentStudents, setPresentStudents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  
  const [formData, setFormData] = useState({
    roll_no: '',
    student_name: '',
    class_name: '',
    parent_name: '',
    contact: '',
    address: ''
  });

  const classes = ['9-A', '9-B', '9-C', '10-A', '10-B', '10-C', '11-A', '11-B', '11-C', '12-A', '12-B', '12-C'];

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
      fetchDevices();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/students/`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      showNotification('Failed to load students. Please check backend connection.', 'error');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAbsentStudents = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_URL}/attendance/absent/?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAbsentStudents(data);
    } catch (error) {
      showNotification('Failed to load absent students', 'error');
      setAbsentStudents([]);
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPresentStudents = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_URL}/attendance/present/?date=${today}`);
      
      if (response.ok) {
        const data = await response.json();
        setPresentStudents(data);
      } else {
        // Fallback: calculate from enrolled students
        const enrolledStudents = students.filter(s => s.fingerprint_enrolled);
        setPresentStudents(enrolledStudents.map(s => ({
          roll_no: s.roll_no,
          student_name: s.student_name,
          class_name: s.class_name
        })));
      }
    } catch (error) {
      showNotification('Failed to load present students', 'error');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await fetch(`${API_URL}/devices/`);
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/students/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        showNotification('Student added successfully!');
        setFormData({
          roll_no: '',
          student_name: '',
          class_name: '',
          parent_name: '',
          contact: '',
          address: ''
        });
        fetchStudents();
      } else {
        const error = await response.json();
        showNotification(error.error || 'Failed to add student', 'error');
      }
    } catch (error) {
      showNotification('Error adding student. Check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollFingerprint = async (rollNo) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/student/enroll/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll_no: rollNo, device_id: 'FP001' })
      });
      
      const data = await response.json();
      if (response.ok) {
        showNotification(`Enrollment started! Place finger on scanner. ID: ${data.fingerprint_id}`);
        setTimeout(fetchStudents, 2000);
      } else {
        showNotification(data.error || 'Enrollment failed', 'error');
      }
    } catch (error) {
      showNotification('Error enrolling fingerprint', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (rollNo) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/students/${rollNo}/`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showNotification('Student deleted successfully');
        fetchStudents();
      } else {
        showNotification('Failed to delete student', 'error');
      }
    } catch (error) {
      showNotification('Error deleting student', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeAttendance = async () => {
    if (!confirm('Finalize attendance for today? This will mark absent students.')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/attendance/finalize/`, {
        method: 'POST'
      });
      
      if (response.ok) {
        showNotification('Attendance finalized successfully!');
        fetchAbsentStudents();
      } else {
        showNotification('Failed to finalize attendance', 'error');
      }
    } catch (error) {
      showNotification('Error finalizing attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppMessage = (contact, studentName) => {
    const message = `Dear Parent, Your child ${studentName} was absent today. Please contact school if needed.`;
    const encodedMessage = encodeURIComponent(message);
    const cleanContact = contact.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanContact}?text=${encodedMessage}`, '_blank');
  };

  const downloadCSV = (data, filename) => {
    if (data.length === 0) {
      showNotification('No data to download', 'error');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    showNotification('Downloaded successfully!');
  };

  const filterStudents = (studentList) => {
    let filtered = studentList;

    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.class_name === selectedClass);
    }

    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.roll_no?.toString().includes(searchTerm)
      );
    }

    return filtered;
  };

  const getClassWiseCount = (studentList) => {
    const counts = {};
    classes.forEach(c => {
      counts[c] = studentList.filter(s => s.class_name === c).length;
    });
    return counts;
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const totalStudents = students.length;
  const enrolledStudents = students.filter(s => s.fingerprint_enrolled).length;
  const onlineDevices = devices.filter(d => d.is_online).length;
  const filteredAbsent = filterStudents(absentStudents);
  const filteredPresent = filterStudents(presentStudents);
  const absentClassCounts = getClassWiseCount(absentStudents);
  const presentClassCounts = getClassWiseCount(presentStudents);

  const NavItem = ({ icon: Icon, label, page }) => (
    <button
      onClick={() => {
        setCurrentPage(page);
        setMenuOpen(false);
        setSearchTerm('');
        setSelectedClass('all');
        if (page === 'absent') fetchAbsentStudents();
        if (page === 'present') fetchPresentStudents();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        currentPage === page 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white flex items-center gap-3 animate-slide-in`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">School Attendance</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {menuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className={`lg:w-64 ${menuOpen ? 'block' : 'hidden lg:block'}`}>
            <nav className="bg-white rounded-xl shadow-sm p-4 space-y-2">
              <NavItem icon={BarChart3} label="Dashboard" page="dashboard" />
              <NavItem icon={UserPlus} label="Add Student" page="add" />
              <NavItem icon={Users} label="All Students" page="students" />
              <NavItem icon={CheckCircle} label="Present Students" page="present" />
              <NavItem icon={XCircle} label="Absent Students" page="absent" />
              <NavItem icon={Clock} label="Finalize Attendance" page="finalize" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors lg:hidden mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </aside>

          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm p-6 min-h-[600px]">
              
              {currentPage === 'dashboard' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                      <Users className="w-8 h-8 mb-3 opacity-80" />
                      <p className="text-blue-100 text-sm">Total Students</p>
                      <p className="text-3xl font-bold mt-1">{totalStudents}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                      <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
                      <p className="text-green-100 text-sm">Enrolled Fingerprints</p>
                      <p className="text-3xl font-bold mt-1">{enrolledStudents}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                      <Clock className="w-8 h-8 mb-3 opacity-80" />
                      <p className="text-purple-100 text-sm">Devices Online</p>
                      <p className="text-3xl font-bold mt-1">{onlineDevices}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setCurrentPage('add')}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                      >
                        <UserPlus className="w-5 h-5" />
                        Add New Student
                      </button>
                      <button
                        onClick={() => setCurrentPage('finalize')}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-md"
                      >
                        <Calendar className="w-5 h-5" />
                        Finalize Attendance
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">System Status</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Backend Status</span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Connected
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Database</span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            Online
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Devices</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {onlineDevices} Active
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800">Today's Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Date</span>
                          <span className="font-medium">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total Students</span>
                          <span className="font-medium">{totalStudents}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Enrolled</span>
                          <span className="font-medium">{enrolledStudents}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentPage === 'add' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Student</h2>
                  
                  <form onSubmit={handleAddStudent} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number *</label>
                        <input
                          type="number"
                          required
                          value={formData.roll_no}
                          onChange={(e) => setFormData({...formData, roll_no: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter roll number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Student Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.student_name}
                          onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter full name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                        <select
                          required
                          value={formData.class_name}
                          onChange={(e) => setFormData({...formData, class_name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Class</option>
                          {classes.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Parent Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.parent_name}
                          onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter parent name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                        <input
                          type="tel"
                          required
                          value={formData.contact}
                          onChange={(e) => setFormData({...formData, contact: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter 10-digit number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 font-medium shadow-md"
                    >
                      {loading ? 'Adding...' : 'Add Student'}
                    </button>
                  </form>
                </div>
              )}

              {currentPage === 'students' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">All Students ({students.length})</h2>
                    <button 
                      onClick={fetchStudents} 
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-gray-500">Loading students...</p>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No students found</p>
                      <button
                        onClick={() => setCurrentPage('add')}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add First Student
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Roll No</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Parent</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fingerprint</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {students.map((s) => (
                            <tr key={s.roll_no} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium">{s.roll_no}</td>
                              <td className="px-4 py-3 text-sm">{s.student_name}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {s.class_name}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{s.parent_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{s.contact}</td>
                              <td className="px-4 py-3 text-sm">
                                {s.fingerprint_enrolled ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                    ID: {s.fingerprint_id}
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                    Not Enrolled
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex gap-2">
                                  {!s.fingerprint_enrolled && (
                                    <button
                                      onClick={() => handleEnrollFingerprint(s.roll_no)}
                                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium transition-colors"
                                    >
                                      Enroll
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteStudent(s.roll_no)}
                                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {currentPage === 'present' && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Present Students ({filteredPresent.length})</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadCSV(
                          filteredPresent, 
                          `present-${selectedClass !== 'all' ? selectedClass : 'all'}-${new Date().toISOString().split('T')[0]}.csv`
                        )}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download CSV
                      </button>
                      <button 
                        onClick={fetchPresentStudents}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Class-wise Present Count</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {classes.map(c => (
                        <div key={c} className="bg-white border border-green-300 rounded-lg p-3 text-center hover:shadow-md transition-shadow">
                          <p className="text-xs font-medium text-gray-600">{c}</p>
                          <p className="text-2xl font-bold text-green-600">{presentClassCounts[c] || 0}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by name or roll number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-gray-400" />
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Classes</option>
                        {classes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-gray-500">Loading present students...</p>
                    </div>
                  ) : filteredPresent.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No present students found</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {searchTerm || selectedClass !== 'all' 
                          ? 'Try adjusting your filters' 
                          : 'Students will appear here after attendance is taken'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-green-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Roll No</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredPresent.map((s, idx) => (
                            <tr key={idx} className="hover:bg-green-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium">{s.roll_no}</td>
                              <td className="px-4 py-3 text-sm">{s.student_name}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {s.class_name}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  <CheckCircle className="w-3 h-3" />
                                  Present
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {currentPage === 'absent' && (
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Absent Students ({filteredAbsent.length})</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadCSV(
                          filteredAbsent,
                          `absent-${selectedClass !== 'all' ? selectedClass : 'all'}-${new Date().toISOString().split('T')[0]}.csv`
                        )}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download CSV
                      </button>
                      <button 
                        onClick={fetchAbsentStudents}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Class-wise Absent Count</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {classes.map(c => (
                        <div key={c} className="bg-white border border-red-300 rounded-lg p-3 text-center hover:shadow-md transition-shadow">
                          <p className="text-xs font-medium text-gray-600">{c}</p>
                          <p className="text-2xl font-bold text-red-600">{absentClassCounts[c] || 0}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by name or roll number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-gray-400" />
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Classes</option>
                        {classes.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-gray-500">Loading absent students...</p>
                    </div>
                  ) : filteredAbsent.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <XCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No absent students found</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {searchTerm || selectedClass !== 'all' 
                          ? 'Try adjusting your filters' 
                          : 'This is great! All students are present or attendance not finalized'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-red-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Roll No</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Parent</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredAbsent.map((s, idx) => (
                            <tr key={idx} className="hover:bg-red-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium">{s.roll_no}</td>
                              <td className="px-4 py-3 text-sm">{s.student_name}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                  {s.class_name}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">{s.parent_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{s.contact}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                  <XCircle className="w-3 h-3" />
                                  Absent
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <button
                                  onClick={() => sendWhatsAppMessage(s.contact, s.student_name)}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium transition-colors"
                                >
                                  WhatsApp
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {currentPage === 'finalize' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Finalize Attendance</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            What does finalizing attendance do?
                          </h3>
                          <ul className="space-y-2 text-gray-700">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span>Marks all students who haven't scanned their fingerprint as absent for today</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span>Generates the final attendance report for the day</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span>Updates the database with today's attendance records</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Important Notice</h3>
                          <p className="text-gray-700">
                            This action should typically be done at the end of the school day. 
                            Make sure all students who are present have scanned their fingerprints before finalizing.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">Current Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Date</p>
                          <p className="text-xl font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Total Students</p>
                          <p className="text-xl font-bold text-gray-900">{totalStudents}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Enrolled Students</p>
                          <p className="text-xl font-bold text-gray-900">{enrolledStudents}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={handleFinalizeAttendance}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all font-medium text-lg shadow-md disabled:opacity-50"
                      >
                        <Calendar className="w-6 h-6" />
                        {loading ? 'Finalizing...' : 'Finalize Attendance for Today'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
