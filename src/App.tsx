import React, { useState, useEffect } from 'react';
import { Submission, User, Affiliate } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmissionPage from './pages/Submission';
import Tracker from './pages/Tracker';
import SubmissionDetail from './pages/SubmissionDetail';
import SubmissionView from './pages/SubmissionView';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import API_URL from './config';

// Utility function to get current UTC+8 timestamp
const getUTC8Timestamp = (): string => {
    const now = new Date();
    const utc8 = new Date(now.getTime() + (8 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
    return utc8.toISOString();
};

export default function INTIMAHub() {
    const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'submission' | 'tracker' | 'submission-detail' | 'submission-view'>('login');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [selectedSubmissionViewId, setSelectedSubmissionViewId] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [formData, setFormData] = useState({
        type: 'SAP' as 'SAP' | 'ASF',
        affiliateId: '',
        activityName: '',
        date: '',
        description: ''
    });
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Clear alert when navigating to a different view
    useEffect(() => {
        setAlert(null);
    }, [currentView]);

    useEffect(() => {
        const loggedInUser = localStorage.getItem('user');
        if (loggedInUser) {
            const user = JSON.parse(loggedInUser);
            setCurrentUser(user);
            if (user.role === 'intima') {
                setCurrentView('dashboard');
            } else {
                setCurrentView('tracker');
            }
        }
    }, []);

    // Fetch affiliates when user changes or submission view is opened
    useEffect(() => {
        if (currentUser && currentView === 'submission') {
            fetch(`${API_URL}/api/user/${currentUser.id}/affiliates`)
                .then(res => res.json())
                .then(data => {
                    setAffiliates(data);
                })
                .catch(err => {
                    console.error('Failed to fetch affiliates:', err);
                });
        }
    }, [currentUser, currentView]);

    // Fetch submissions when viewing dashboard
    useEffect(() => {
        if (currentUser?.role === 'intima' && currentView === 'dashboard') {
            fetch(`${API_URL}/api/submissions`)
                .then(res => res.json())
                .then(data => {
                    setSubmissions(data);
                })
                .catch(err => {
                    console.error('Failed to fetch submissions:', err);
                });
        }
    }, [currentUser, currentView]);

    const handleLogin = (user: User) => {
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
        if (user.role === 'intima') {
            setCurrentView('dashboard');
        } else {
            setCurrentView('tracker');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setCurrentUser(null);
        setCurrentView('login');
        setIsMobileMenuOpen(false);
    };

    const validateForm = () => {
        const errors: string[] = [];
        if (!formData.affiliateId) errors.push('Please select an affiliate');
        if (!formData.activityName) errors.push('Activity name is required');
        if (!formData.date) errors.push('Activity date is required');
        if (selectedFiles.length === 0) errors.push('At least one document must be uploaded');
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                // Step 1: Upload all selected files
                const uploadedFilePaths: string[] = [];

                for (const file of selectedFiles) {
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);
                    uploadFormData.append('submissionType', formData.type);
                    uploadFormData.append('activityName', formData.activityName);
                    uploadFormData.append('date', formData.date);

                    const uploadResponse = await fetch(`${API_URL}/api/upload`, {
                        method: 'POST',
                        body: uploadFormData,
                    });

                    if (!uploadResponse.ok) {
                        throw new Error(`Failed to upload ${file.name}`);
                    }

                    const uploadData = await uploadResponse.json();
                    uploadedFilePaths.push(uploadData.path);
                }

                // Step 2: Submit form with uploaded file paths
                const endpoint = `${API_URL}/api/submission/${formData.type.toLowerCase()}`;

                const submissionData = {
                    affiliateId: formData.affiliateId,
                    activityName: formData.activityName,
                    date: formData.date,
                    description: formData.description,
                    files: uploadedFilePaths,
                    submittedBy: currentUser?.id || 'Unknown',
                };

                const submitResponse = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(submissionData),
                });

                if (!submitResponse.ok) {
                    throw new Error('Failed to submit');
                }

                const data = await submitResponse.json();

                // Find affiliate name for display
                const affiliate = affiliates.find(a => a.id === formData.affiliateId);

                const newSubmission: Submission = {
                    id: data.id,
                    type: formData.type,
                    affiliateName: affiliate?.name || 'Unknown Affiliate',
                    activityName: formData.activityName,
                    date: formData.date,
                    status: 'Pending Validation',
                    documents: uploadedFilePaths,
                    submittedBy: currentUser?.name || 'Unknown',
                    submittedAt: getUTC8Timestamp(),
                    updatedAt: getUTC8Timestamp(),
                };
                setSubmissions([newSubmission, ...submissions]);

                // Reset form
                setFormData({
                    type: 'SAP',
                    affiliateId: '',
                    activityName: '',
                    date: '',
                    description: ''
                });
                setSelectedFiles([]);
                setValidationErrors([]);

                // Show success alert and redirect
                setAlert({
                    type: 'success',
                    message: `Your ${formData.type} submission has been successfully submitted!`
                });
                setCurrentView('tracker');
            } catch (err) {
                console.error('Error submitting form:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to submit form. Please try again.';
                setAlert({
                    type: 'error',
                    message: errorMessage
                });
                setValidationErrors([errorMessage]);
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            // Filter for PDF files only
            const pdfFiles = fileArray.filter(file => file.type === 'application/pdf');

            if (pdfFiles.length !== fileArray.length) {
                setValidationErrors([...validationErrors, 'Only PDF files are allowed']);
            }

            // Store the file objects locally (don't upload yet)
            setSelectedFiles([...selectedFiles, ...pdfFiles]);
        }
    };

    if (currentView === 'login') {
        return <Login handleLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentUser={currentUser} handleLogout={handleLogout} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
            <Sidebar currentUser={currentUser} handleLogout={handleLogout} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} setCurrentView={setCurrentView} currentView={currentView} />

            {alert && (
                <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 max-w-md ${alert.type === 'success'
                    ? 'bg-green-100 border border-green-400 text-green-800'
                    : 'bg-red-100 border border-red-400 text-red-800'
                    }`}>
                    <div className="flex items-center justify-between">
                        <span className="font-medium">{alert.message}</span>
                        <button
                            onClick={() => setAlert(null)}
                            className="ml-4 text-lg font-bold hover:opacity-70"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {currentView === 'dashboard' && currentUser?.role === 'intima' && (
                    <Dashboard
                        submissions={submissions}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        setCurrentView={setCurrentView}
                        setSelectedSubmission={setSelectedSubmission}
                    />
                )}

                {currentView === 'submission-detail' && selectedSubmission && (
                    <div>
                        <button
                            onClick={() => {
                                setCurrentView('dashboard');
                                setSelectedSubmission(null);
                            }}
                            className="mb-6 px-4 py-2 text-red-600 hover:text-red-800 font-medium"
                        >
                            ← Back to Dashboard
                        </button>
                        <SubmissionDetail submission={selectedSubmission} currentUser={currentUser} />
                    </div>
                )}

                {currentView === 'submission' && (
                    <SubmissionPage
                        formData={formData}
                        setFormData={setFormData}
                        validationErrors={validationErrors}
                        uploadedFiles={selectedFiles}
                        handleFileUpload={handleFileUpload}
                        setUploadedFiles={setSelectedFiles}
                        handleSubmit={handleSubmit}
                        setCurrentView={setCurrentView}
                        affiliates={affiliates}
                    />
                )}

                {currentView === 'tracker' && (
                    <Tracker currentUser={currentUser} setCurrentView={setCurrentView} onSelectSubmission={setSelectedSubmissionViewId} />
                )}

                {currentView === 'submission-view' && selectedSubmissionViewId && (
                    <SubmissionView submissionId={selectedSubmissionViewId} currentUser={currentUser} setCurrentView={setCurrentView} />
                )}
            </main>
        </div>
    );
}
