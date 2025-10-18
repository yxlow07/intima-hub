import React, { useState, useEffect } from 'react';
import { Submission, User, Affiliate } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmissionPage from './pages/Submission';
import Tracker from './pages/Tracker';
import SubmissionDetail from './pages/SubmissionDetail';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import API_URL from './config';

export default function INTIMAHub() {
    const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'submission' | 'tracker' | 'submission-detail'>('login');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
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
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

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
        if (uploadedFiles.length === 0) errors.push('At least one document must be uploaded');
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            const endpoint = `${API_URL}/api/submission/${formData.type.toLowerCase()}`;

            const submissionData = {
                affiliateId: formData.affiliateId,
                activityName: formData.activityName,
                date: formData.date,
                description: formData.description,
                fileUrl: uploadedFiles[0] || null, // Store first uploaded file URL
                submittedBy: currentUser?.id || 'Unknown',
            };

            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to submit');
                    return res.json();
                })
                .then(data => {
                    // Find affiliate name for display
                    const affiliate = affiliates.find(a => a.id === formData.affiliateId);

                    const newSubmission: Submission = {
                        id: data.id,
                        type: formData.type,
                        affiliateName: affiliate?.name || 'Unknown Affiliate',
                        activityName: formData.activityName,
                        date: formData.date,
                        status: 'Pending Validation',
                        documents: uploadedFiles,
                        submittedBy: currentUser?.name || 'Unknown',
                        submittedAt: new Date().toISOString(),
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
                    setUploadedFiles([]);
                    setValidationErrors([]);
                    setCurrentView('tracker');
                })
                .catch(err => {
                    console.error('Error submitting form:', err);
                    setValidationErrors(['Failed to submit form. Please try again.']);
                });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files);
            for (const file of fileArray) {
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch(`${API_URL}/api/upload`, {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error('File upload failed');
                    }

                    const data = await response.json();
                    setUploadedFiles([...uploadedFiles, data.path]);
                } catch (error) {
                    console.error('Error uploading file:', error);
                    setValidationErrors([...validationErrors, `Failed to upload ${file.name}`]);
                }
            }
        }
    };

    if (currentView === 'login') {
        return <Login handleLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentUser={currentUser} handleLogout={handleLogout} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
            <Sidebar currentUser={currentUser} handleLogout={handleLogout} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} setCurrentView={setCurrentView} currentView={currentView} />

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
                        uploadedFiles={uploadedFiles}
                        handleFileUpload={handleFileUpload}
                        setUploadedFiles={setUploadedFiles}
                        handleSubmit={handleSubmit}
                        setCurrentView={setCurrentView}
                        affiliates={affiliates}
                    />
                )}

                {currentView === 'tracker' && (
                    <Tracker currentUser={currentUser} setCurrentView={setCurrentView} />
                )}
            </main>
        </div>
    );
}
