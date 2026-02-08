// frontend/src/components/StudentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
// Assuming these components exist for rendering
import TestScreen from './Test.js';
import ResultsScreen from './Results.jsx';
import ReviewScreen from './ReviewScreen.jsx'; 
import { collection, query, where, getDocs } from "firebase/firestore"; // Import Firestore methods
import { db } from '../firebase.js'; // Import firebase db object

// START: ADD CHART.JS IMPORTS AND REGISTRATION
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
// END: ADD CHART.JS IMPORTS AND REGISTRATION

// Assuming API_URL is defined in a centralized place like api.js or main App.js
const API_URL = 'http://localhost:5000';

// MOCK_COURSES now includes icons for the new subject cards
const MOCK_COURSES = [
    { id: 'dsa', name: 'Data Structures & Algorithms', icon: '🧩' },
    { id: 'os', name: 'Operating Systems', icon: '💻' },
    { id: 'cn', name: 'Computer Networks', icon: '🌐' },
    { id: 'dbms', name: 'DBMS', icon: '💾' },
    { id: 'oops', name: 'OOPS', icon: '🔷' },
    { id: 'c', name: 'C', icon: '🔤' },
];

function StudentDashboard({ user, onLogout }) {
    // Current screen now defaults to 'subjects' (the first step in the new flow)
    const [currentScreen, setCurrentScreen] = useState('subjects');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [testData, setTestData] = useState(null);
    const [testResults, setTestResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [reviewData, setReviewData] = useState(null);

    // States to manage the backend data structure
    const [availableTests, setAvailableTests] = useState([]);
    const [missedTests, setMissedTests] = useState([]); 
    const [testHistory, setTestHistory] = useState({}); 

    // --- Combined Data Fetching Logic ---
    
    // Fetches ALL relevant test data for the dashboard view
    const fetchAllTestData = useCallback(async (courseId) => {
        if (!user?.uid || !courseId) return;
        setIsLoading(true);
        setError('');

        try {
            // 1. Fetch available tests (status = active)
            const availableResponse = await fetch(`${API_URL}/api/tests/available`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: user.uid }),
            });
            
            if (!availableResponse.ok) throw new Error("Failed to fetch available tests.");
            const tests = await availableResponse.json();
            setAvailableTests(tests.filter(t => t.courseId === courseId)); 

            // 2. Fetch completed test history
            const historyResponse = await fetch(`${API_URL}/api/tests/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: user.uid }),
            });
            if (!historyResponse.ok) throw new Error("Failed to fetch test history.");
            const historyData = await historyResponse.json();
            const courseHistory = historyData[courseId] || [];
            setTestHistory(historyData); 
            
            // --- 3. LOGIC FOR MISSED TESTS ---
            
            // A. Get all Faculty-Released Tests for the selected course
            const testsRef = collection(db, 'tests');
            const q = query(testsRef, where('courseId', '==', courseId));
            const querySnapshot = await getDocs(q);
            const allFacultyTests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // B. Determine which tests the student has already completed
            const completedTestIds = new Set(courseHistory.map(t => t.originalTestId));
            
            // C. Filter for Missed Tests
            const now = new Date();
            const missed = allFacultyTests.filter(test => {
                const isInactive = test.status === 'inactive';
                const isExpired = test.scheduledEnd && new Date(test.scheduledEnd) <= now;
                const isCompleted = completedTestIds.has(test.id);

                // A test is "Missed" if it's inactive/expired AND the student has NOT completed it.
                return (isInactive || isExpired) && !isCompleted; 
            });
            
            setMissedTests(missed);
            // --- END LOGIC FOR MISSED TESTS ---

        } catch (err) {
            console.error('Error fetching all test data:', err);
            setError('Error fetching tests: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [user?.uid]);

    // Initial load and refetch on course selection
    useEffect(() => {
        if (selectedCourse) {
            fetchAllTestData(selectedCourse.id);
        }
    }, [selectedCourse, fetchAllTestData]);


    // --- Navigation Handlers ---
    
    // Step 1: Select a course subject
    const handleSubjectSelect = (course) => {
        setSelectedCourse(course);
        setCurrentScreen('tests');
    };

    // Go back to the subject list
    const handleBackToSubjects = () => {
        setSelectedCourse(null);
        setCurrentScreen('subjects');
        setAvailableTests([]);
        setMissedTests([]);
    };

    // Reset flow after test completion or error
    const resetToDashboard = () => {
        setCurrentScreen('subjects'); 
        setTestData(null);
        setTestResults(null);
        setError('');
        // Re-fetch all data on dashboard return
        if (user) {
             fetchAllTestData(selectedCourse?.id || null);
        }
    };
    
    // --- Test Action Handlers ---
    
    // Fetches test results/details for review (used by History and Missed Tests)
    const viewTestReview = async (testId) => {
      setIsLoading(true);
      setError('');
      try {
        // Determine if this is a Missed Test ID (from main 'tests' collection).
        const isMissed = missedTests.some(test => test.id === testId);
        
        let endpoint = isMissed 
            ? `${API_URL}/api/tests/missed-details/${testId}` // NEW API for missed
            : `${API_URL}/api/results/${testId}`;           // EXISTING API for completed history

        const response = await fetch(endpoint); 
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch review data.');
        }

        const data = await response.json();
        setReviewData(data);
        setCurrentScreen('review');
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Starts a specific test released by faculty
    const startTest = async (testId) => {
        setIsLoading(true);
        setError('');
        try {
            // Uses the new specific start endpoint
            const response = await fetch(`${API_URL}/api/tests/start-specific`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: user.uid, testId }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Failed to start test.';
                
                // If the test has expired or is invalid, re-fetch data to update UI to Missed/History
                if (errorMessage.includes('already taken') || errorMessage.includes('expired') || errorMessage.includes('not available')) {
                    fetchAllTestData(selectedCourse.id); 
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            setTestData(data);
            setCurrentScreen('test');
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Submits the test and triggers data refresh
    const submitTest = useCallback(async (answers) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/api/tests/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    testId: testData.testId, 
                    answers 
                }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to submit test: ${errorText}`);
            }
            
            const results = await response.json();
            
            setTestResults(results);
            setCurrentScreen('results');
            
            // Refresh lists after submission
            fetchAllTestData(selectedCourse.id);

        } catch (err) {
            console.error('Error submitting test:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [testData?.testId, selectedCourse?.id, fetchAllTestData]);


    // --- Rendering Views ---

    const renderSubjectSelection = () => (
        <div className="card">
            <h2>Welcome, {user.name}!</h2>
            <p>Select a subject to view available tests</p>
            <div className="subjects-grid">
                {MOCK_COURSES.map(course => (
                    <div 
                        key={course.id} 
                        className="subject-card"
                        onClick={() => handleSubjectSelect(course)}
                    >
                        <div className="subject-icon">{MOCK_COURSES.find(c => c.id === course.id)?.icon || '📚'}</div>
                        <h3>{course.name}</h3>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderTestsForSubject = () => {
        if (!selectedCourse) return null;
        
        // Filter tests and history based on the selected course
        const courseTests = availableTests.filter(test => test.courseId === selectedCourse.id);
        let courseHistory = testHistory[selectedCourse.id] || [];

        // --- START: HISTORY DATA PROCESSING FOR CHART ---
        // Sort history by completion date (oldest first for trend analysis)
        const sortedHistory = [...courseHistory].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

        const chartLabels = sortedHistory.map((t, index) => `${t.testName} (${index + 1})`);
        const chartScores = sortedHistory.map(t => t.score);
        
        const improvementTrendData = {
            labels: chartLabels,
            datasets: [{
                label: 'Score',
                data: chartScores,
                fill: false,
                borderColor: '#007bff',
                tension: 0.1,
                // Make point styles consistent with FacultyDashboard
                pointBackgroundColor: '#007bff', 
                pointRadius: 5
            }]
        };

        const improvementTrendOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: false },
                legend: { position: 'top' } // Show legend at the top
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    max: 100, 
                    title: { display: true, text: 'Score (%)' } 
                },
                x: {
                     title: { display: false }
                }
            },
        };
        // --- END: HISTORY DATA PROCESSING FOR CHART ---


        return (
            <div>
                {/* Back button and header */}
                <div className="card" style={{marginBottom: '2rem'}}>
                    <button 
                        onClick={handleBackToSubjects}
                        className="btn btn-secondary"
                        style={{marginBottom: '1rem'}}
                    >
                        ← Back to Subjects
                    </button>
                    <h2>{selectedCourse.name} Tests</h2>
                </div>
                
                {/* --- 1. Available Tests List --- */}
                <div className="card">
                    <h3>Available Tests</h3>
                    <div className="student-tests">
                        {courseTests.length > 0 ? (
                            courseTests.map(test => (
                                <div key={test.id} className="test-card">
                                    <div className="test-header">
                                        <h4>{test.testName}</h4>
                                        <span className={`test-status ${test.status === 'active' ? 'status-active' : 'status-scheduled'}`}>
                                            {test.status === 'active' ? 'Available' : 'Scheduled'}
                                        </span>
                                    </div>
                                    <div className="test-details">
                                        <p>Duration: {test.durationMinutes} minutes</p> 
                                        <p>Questions: {test.questionCount}</p>
                                        {test.scheduledFor && <p>Start: {new Date(test.scheduledFor).toLocaleString()}</p>}
                                        {test.scheduledEnd && <p style={{fontWeight: 'bold', color: '#D22D64'}}>Ends: {new Date(test.scheduledEnd).toLocaleString()}</p>}
                                    </div>
                                    {test.status === 'active' && (
                                        <button 
                                            onClick={() => startTest(test.id)}
                                            className="btn btn-primary"
                                        >
                                            {'Start Test'}
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="test-availability">
                                <p>No tests available for {selectedCourse.name} at the moment</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- 2. Missed/Expired Tests List (NEW SECTION) --- */}
                <div className="card" style={{marginTop: '2rem'}}>
                    <h3>Missed/Expired Tests ({missedTests.length})</h3>
                    <p style={{color: '#b91c1c', fontSize: '0.9em'}}>These tests have expired and can no longer be started. Click "View Analysis" to see results.</p>
                    <div className="student-tests">
                        {missedTests.length > 0 ? (
                            missedTests.map(test => (
                                <div key={test.id} className="test-card missed-test-card">
                                    <div className="test-header">
                                        <h4>{test.testName}</h4>
                                        <span className="test-status status-inactive">
                                            MISSED
                                        </span>
                                    </div>
                                    <div className="test-details">
                                        <p>Questions: {test.questionIds?.length || 0}</p>
                                        <p>Expired: {test.scheduledEnd ? new Date(test.scheduledEnd).toLocaleString() : 'N/A'}</p>
                                    </div>
                                    <button 
                                        onClick={() => viewTestReview(test.id)} // <--- FIXED to call viewTestReview
                                        className="btn btn-secondary btn-sm"
                                        style={{marginTop: '0.5rem'}}
                                    >
                                        View Analysis (Read Only)
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>No expired tests found that you missed for this course. Excellent!</p>
                        )}
                    </div>
                </div>

                {/* --- 3. Test History List --- */}
                {courseHistory.length > 0 && (
                    <div className="card" style={{marginTop: '2rem'}}>
                        <h3>Test History</h3>
                        <div className="test-history">
                            {courseHistory.map(history => (
                                <div key={history.testId} className="history-item"  onClick={() => viewTestReview(history.testId)}
                                    style={{ cursor: 'pointer' }}>
                                    <div>
                                        <strong>{history.testName}</strong>
                                        <p>Completed: {new Date(history.completedAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className="score-badge">{history.score.toFixed(2)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- 4. IMPROVEMENT TREND CHART --- */}
                {courseHistory.length >= 2 && (
                    <div className="card" style={{marginTop: '2rem'}}>
                        <h3>Improvement Trend</h3>
                        <div className="chart-container" style={{height: '300px'}}>
                            <Line 
                                data={improvementTrendData}
                                options={improvementTrendOptions}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };


    return (
        <div className="app-container">
            <nav className="navbar">
                <h1>Student Dashboard</h1>
                <button onClick={onLogout} className="btn btn-danger">Logout</button>
            </nav>
            <main className="main-content">
                {isLoading && <div className="message">Loading...</div>}
                {error && <div className="message error-message">{error}</div>}

                {currentScreen === 'subjects' && renderSubjectSelection()}
                {currentScreen === 'tests' && renderTestsForSubject()}
                {currentScreen === 'test' && testData && <TestScreen testData={testData} onTestSubmit={submitTest} />}
                {currentScreen === 'results' && testResults && <ResultsScreen results={testResults} onBack={resetToDashboard} />}
                {currentScreen === 'review' && reviewData && <ReviewScreen reviewData={reviewData} onBack={() => setCurrentScreen('tests')} />}
            </main>
        </div>
    );
}

export default StudentDashboard;