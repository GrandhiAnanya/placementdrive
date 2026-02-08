// frontend/src/components/Login.js
import React, { useState } from 'react';
// The following imports are now correctly grouped
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase.js';

const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');

    const isValidStudentEmail = (email) => {
        // Calculate the last two digits of the joining year (current year - 2)
        const currentYear = new Date().getFullYear();
        const joinYear = (currentYear - 2).toString().slice(-2);
        
        // Regex to match the required Amrita student email format
        const regex = new RegExp(`^bl\\.sc\\.u4cse${joinYear}[0-9]{3}@bl\\.students\\.amrita\\.edu$`);
        return regex.test(email);
    };

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                // --- LOG IN LOGIC ---
                // No constraint check here. Rely on Firebase for authentication errors (e.g., user not found, wrong password).
                await signInWithEmailAndPassword(auth, email, password);
                
            } else {
                // --- SIGN UP LOGIC ---
                
                // 1. Check for Name on Sign Up (required for all new users)
                if (!name) {
                    setError("Please enter your name.");
                    return;
                }

                // 2. Apply Student Email Constraint ONLY during Sign Up AND if role is student
                if (role === 'student' && !isValidStudentEmail(email)) {
                    const dynamicYearSuffix = (new Date().getFullYear() - 2).toString().slice(-2);
                    setError(`Invalid student email format. Use: bl.sc.u4cse${dynamicYearSuffix}xxx@bl.students.amrita.edu.`);
                    return;
                }

                // 3. Create the user
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), { name, email, role });
            }
        } catch (err) {
            // Handle Firebase auth errors (e.g., wrong password, email already in use)
            setError(err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card amrita-style">
                <h1 className="portal-title"><span>AMRITA</span></h1>
                <p className="portal-subtitle">PLACEMENT DRIVE</p>
                <h2 style={{fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1f2937'}}>
                    {isLogin ? 'Login' : 'Sign Up'}
                </h2>
                <form onSubmit={handleAuthAction}>
                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                    )}
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    {!isLogin && (
                        <div className="input-group">
                            <label>Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                            </select>
                        </div>
                    )}
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-login">
                        {isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
                    </button>
                </form>
                <p className="auth-toggle">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
