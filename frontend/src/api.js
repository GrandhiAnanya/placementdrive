// frontend/src/api.js

const API_URL = 'http://localhost:5000/api';

export const startTest = async (studentId, courseId) => {
    try {
        const response = await fetch(`${API_URL}/tests/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, courseId }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to start test.');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const submitTest = async (testId, answers) => {
    try {
        const response = await fetch(`${API_URL}/tests/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId, answers }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to submit test.');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const addQuestion = async (questionData) => {
    try {
        const response = await fetch(`${API_URL}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add question.');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

