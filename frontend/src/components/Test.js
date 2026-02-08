// frontend/src/components/Test.js
import React, { useState, useEffect } from 'react';

const TestScreen = ({ testData, onTestSubmit }) => {
    // State to store the student's answers (key: questionId, value: optionIndex)
    const [answers, setAnswers] = useState({});
    
    // Initialize timeLeft using testData.durationMinutes (new structure)
    // Fallback to 3600 seconds (1 hour) if durationMinutes is missing
    const initialDuration = testData.durationMinutes ? testData.durationMinutes * 60 : 3600;
    const [timeLeft, setTimeLeft] = useState(initialDuration); 

    useEffect(() => {
        // If time runs out, automatically submit the test
        if (timeLeft <= 0) {
            // Show custom UI notification instead of alert()
            const timeoutMessage = document.getElementById('timeout-message');
            if (timeoutMessage) { timeoutMessage.style.display = 'flex'; }
            
            // Auto-submit after a short delay (3 seconds) to show the message
            const autoSubmitTimer = setTimeout(() => {
                onTestSubmit(answers);
            }, 3000); 
            
            return () => clearTimeout(autoSubmitTimer);
        }
        
        // Timer countdown logic
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, onTestSubmit, answers]);

    const handleOptionChange = (qId, optIdx) => {
        setAnswers(prev => ({ ...prev, [qId]: optIdx }));
    }

    const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const handleSubmit = () => { onTestSubmit(answers); };

    return (
        <div className="card">
            {/* Custom UI for Time Out Message - Hidden by default */}
            <div id="timeout-message" style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(210, 45, 100, 0.95)', color: 'white', fontSize: '2rem', 
                display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
                Time is up! Submitting your test...
            </div>

            <div className="test-header">
                {/* Displaying testName from the new testData structure */}
                <h1>{testData.testName || 'Test in Progress'}</h1>
                <div className="timer">{formatTime(timeLeft)}</div>
            </div>

            <p style={{marginBottom: '2rem', color: '#6b7280'}}>Attempt all {testData.questions.length} questions before the timer runs out.</p>

            {testData.questions.map((q, index) => (
                <div key={q.id} className="question-block">
                    <h3>{index + 1}. {q.questionText}</h3>
                    <div className="options-group">
                        {q.options.map((opt, i) => (
                            <label key={i} className="option-label">
                                <input type="radio" name={q.id} value={i} checked={answers[q.id] === i} onChange={() => handleOptionChange(q.id, i)} />
                                <span>{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
            
            <p style={{textAlign: 'center', marginTop: '1rem', color: '#374151', fontWeight: 600}}>
                {Object.keys(answers).length} of {testData.questions.length} Questions Answered
            </p>

            <button onClick={handleSubmit} className="btn btn-success btn-full">
                Submit Test
            </button>
        </div>
    );
};

export default TestScreen;
