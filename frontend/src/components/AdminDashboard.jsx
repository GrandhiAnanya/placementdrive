import React, { useState } from 'react';

// With the proxy, we no longer need the full API_URL. We can use relative paths.
// const API_URL = 'http://localhost:5000'; // This line is no longer needed.

const AdminDashboard = ({ user, onLogout }) => {
    // ... (all your existing state variables)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [uploadFile, setUploadFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const getAuthToken = async () => {
        if (!user || typeof user.getIdToken !== 'function') {
            throw new Error("User not authenticated correctly.");
        }
        return await user.getIdToken();
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');

        try {
            const token = await getAuthToken();
            // --- FIX: Use the relative path, which will be caught by the proxy ---
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, password, role }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to create user.');

            setMessage(result.message);
            setName('');
            setEmail('');
            setPassword('');
            setRole('student');

        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            setMessage('Error: Please select a file.');
            return;
        }
        
        setIsSubmitting(true);
        setMessage('');
        
        const formData = new FormData();
        formData.append('usersFile', uploadFile);

        try {
            const token = await getAuthToken();
             // --- FIX: Use the relative path for the file upload ---
            const response = await fetch('/api/admin/upload-users', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            // If the response is not JSON, it could still be an error.
            if (!response.ok) {
                 const errorText = await response.text();
                 throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            let formattedMessage = result.message;
            if (result.errors && result.errors.length > 0) {
                formattedMessage += `\nErrors:\n- ${result.errors.join('\n- ')}`;
            }
            setMessage(formattedMessage);
            
            setUploadFile(null);
            if(document.getElementById('file-upload-input')) {
                document.getElementById('file-upload-input').value = '';
            }

        } catch (error) {
            // This will now catch the HTML error and display it, if it still happens.
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // ... (rest of your component code: downloadCsvTemplate and the return JSX)
    const downloadCsvTemplate = () => {
        const headers = ['name', 'email', 'password', 'role'];
        const exampleRow = ['John Student', 'john.student@example.com', 'strongPassword123', 'student'];
        const exampleRow2 = ['Jane Faculty', 'jane.faculty@example.com', 'anotherPassword456', 'faculty'];
        const csvContent = [headers.join(','), exampleRow.join(','), exampleRow2.join(',')].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'UserUploadTemplate.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="app-container">
            <nav className="navbar">
                <h1>Admin Dashboard</h1>
                <button onClick={onLogout} className="btn btn-danger">Logout</button>
            </nav>
            <main className="main-content">
                {message && (
                    <div className={`message ${message.toLowerCase().includes('error') || message.toLowerCase().includes('failed') ? 'error' : 'success'}`} style={{ whiteSpace: 'pre-wrap' }}>
                        {message}
                    </div>
                )}
                <div className="card">
                    <h3>Add Single User</h3>
                    <form onSubmit={handleAddUser}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., John Doe" required />
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g., user@example.com" required />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required />
                        </div>
                        <div className="input-group">
                            <label>Role</label>
                            <select value={role} onChange={e => setRole(e.target.value)}>
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isSubmitting} className="btn btn-success btn-full">
                            {isSubmitting ? 'Creating...' : 'Create User'}
                        </button>
                    </form>
                </div>
                <div className="card" style={{marginTop: '2rem'}}>
                    <h3>Bulk Upload Users (.csv)</h3>
                     <p>
                        Required headers: <strong>name, email, password, role</strong>.
                        <span 
                            onClick={downloadCsvTemplate} 
                            style={{ color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline', marginLeft: '5px' }}
                        >
                            Download Template
                        </span>
                    </p>
                    <form onSubmit={handleFileUpload}>
                        <div className="input-group">
                            <input 
                                id="file-upload-input"
                                type="file" 
                                accept=".csv" 
                                onChange={(e) => setUploadFile(e.target.files[0])} 
                                required 
                            />
                        </div>
                        <button type="submit" disabled={isSubmitting || !uploadFile} className="btn btn-primary">
                            {isSubmitting ? 'Uploading...' : 'Upload Users CSV'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;

