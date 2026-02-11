// frontend/src/components/Test.js
import React, { useState, useEffect, useRef } from 'react';

const TestScreen = ({ testData, onTestSubmit }) => {
    const [answers, setAnswers] = useState({});
    const initialDuration = testData.durationMinutes ? testData.durationMinutes * 60 : 3600;
    const [timeLeft, setTimeLeft] = useState(initialDuration); 
    const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
    
    // Ref to prevent glitching/loops during submission
    const hasSubmitted = useRef(false); 

    useEffect(() => {
        if (hasSubmitted.current) return;

        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }

        if (timeLeft <= 0 && !hasSubmitted.current) {
            hasSubmitted.current = true;
            setIsAutoSubmitting(true);

            const timeoutMessage = document.getElementById('timeout-message');
            if (timeoutMessage) {
                timeoutMessage.style.display = 'flex';
            }

            // 5-second delay to show the progress bar
            setTimeout(() => {
                onTestSubmit(answers);
            }, 5000); 
        }
    }, [timeLeft, onTestSubmit, answers]);

    const handleOptionChange = (qId, optIdx) => {
        if (hasSubmitted.current) return; 
        setAnswers(prev => ({ ...prev, [qId]: optIdx }));
    };

    const formatTime = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    
    const handleSubmit = () => { 
        if (!hasSubmitted.current) {
            hasSubmitted.current = true;
            onTestSubmit(answers); 
        }
    };

    return (
        <div className="test-screen-container">
            {/* FULL-SCREEN TIMEOUT MODAL (CENTERED VIA FIXED CSS) */}
            <div id="timeout-message">
                <div className="timeout-card">
                    <div className="timeout-spinner"></div>
                    <h2 style={{ color: '#D22D64', margin: '0 0 1rem 0', fontWeight: '800' }}>Time Expired!</h2>
                    <p style={{ color: '#4b5563', marginBottom: '2rem', fontSize: '1.1rem' }}>
                        Your attempt is being secured and submitted automatically. Please do not refresh.
                    </p>
                    <div className="submitting-bar">
                        <div className="submitting-progress"></div>
                    </div>
                    <div style={{ color: '#D22D64', fontWeight: 'bold', marginTop: '1.2rem', letterSpacing: '1px' }}>
                        SUBMITTING...
                    </div>
                </div>
            </div>

            {/* STICKY HEADER - Contains the title and the live timer */}
            <div className="sticky-test-header">
                <div className="test-header-flex">
                    <h1 className="test-title">{testData.testName || 'Test in Progress'}</h1>
                    <div className="timer">{formatTime(timeLeft)}</div>
                </div>
            </div>

            <div className="test-content-padding">
                <p style={{marginTop: '1.5rem', marginBottom: '2rem', color: '#6b7280'}}>
                    Attempt all {testData.questions.length} questions before the timer runs out.
                </p>

                {testData.questions.map((q, index) => (
                    <div key={q.id} className="question-block">
                        <h3>{index + 1}. {q.questionText}</h3>
                        <div className="options-group">
                            {q.options.map((opt, i) => (
                                <label key={i} className="option-label">
                                    <input 
                                        type="radio" 
                                        name={q.id} 
                                        value={i} 
                                        checked={answers[q.id] === i} 
                                        onChange={() => handleOptionChange(q.id, i)} 
                                        disabled={isAutoSubmitting}
                                    />
                                    <span>{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
                
                <p style={{textAlign: 'center', marginTop: '1rem', color: '#374151', fontWeight: 600}}>
                    {Object.keys(answers).length} of {testData.questions.length} Questions Answered
                </p>

                <button 
                    onClick={handleSubmit} 
                    className="btn btn-success btn-full"
                    disabled={isAutoSubmitting}
                >
                    {isAutoSubmitting ? 'Submitting...' : 'Submit Test'}
                </button>
            </div>
        </div>
    );
};

export default TestScreen;