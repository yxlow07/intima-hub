import { useState, useEffect } from 'react';
import { Eye, Download, MessageSquare, CheckCircle, AlertCircle, Clock, XCircle, Loader } from 'lucide-react';
import { Submission, User, SubmissionDetail } from '../types';
import API_URL from '../config';

interface TrackerProps {
    currentUser: User | null;
    setCurrentView: (view: 'login' | 'dashboard' | 'submission' | 'tracker') => void;
}

export default function Tracker({ currentUser }: TrackerProps) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        if (currentUser) {
            fetch(`${API_URL}/api/submissions/user/${currentUser.id}`)
                .then(res => res.json())
                .then(data => {
                    setSubmissions(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch submissions:', err);
                    setLoading(false);
                });
        }
    }, [currentUser]);

    // Handle Esc key to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // Refresh submission data from DB before closing
                if (selectedSubmission) {
                    refreshSubmissionData(selectedSubmission.id);
                }
                setSelectedSubmission(null);
            }
        };
        if (selectedSubmission) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [selectedSubmission]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'text-green-600 bg-green-50';
            case 'Requires Amendment': return 'text-orange-600 bg-orange-50';
            case 'Awaiting INTIMA Review': return 'text-blue-600 bg-blue-50';
            case 'Pending Validation': return 'text-yellow-600 bg-yellow-50';
            case 'Rejected': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved': return <CheckCircle className="w-4 h-4" />;
            case 'Requires Amendment': return <AlertCircle className="w-4 h-4" />;
            case 'Awaiting INTIMA Review': return <Clock className="w-4 h-4" />;
            case 'Pending Validation': return <Clock className="w-4 h-4" />;
            case 'Rejected': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Static list of all possible statuses
    const allStatuses = ['All', 'Pending Validation', 'Awaiting INTIMA Review', 'Requires Amendment', 'Approved', 'Rejected'];

    // Filter submissions based on selected status
    const filteredSubmissions = statusFilter === 'all'
        ? submissions
        : submissions.filter(s => s.status === statusFilter);

    const handleAddComment = async () => {
        if (!selectedSubmission || !currentUser || !commentText.trim()) return;

        try {
            const response = await fetch(`${API_URL}/api/submission/${selectedSubmission.id}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    formType: selectedSubmission.type,
                    text: commentText,
                    userId: currentUser.id,
                    userName: currentUser.name,
                }),
            });

            if (!response.ok) throw new Error('Failed to add comment');

            // Update the feedback/comments in the selected submission
            const newComment = {
                author: currentUser.name,
                authorId: currentUser.id,
                text: commentText,
                timestamp: new Date().toISOString(),
            };

            const updatedFeedback = Array.isArray(selectedSubmission.feedback)
                ? [...selectedSubmission.feedback, newComment]
                : [newComment];

            setSelectedSubmission({
                ...selectedSubmission,
                feedback: updatedFeedback,
            });

            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleDeleteComment = async (index: number) => {
        if (!selectedSubmission || !Array.isArray(selectedSubmission.feedback) || !currentUser) return;

        try {
            // Update backend with authorization check
            const response = await fetch(`${API_URL}/api/submission/${selectedSubmission.id}/comment`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    formType: selectedSubmission.type,
                    commentIndex: index,
                    userId: currentUser.id,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete comment');
            }

            // Remove comment from local state
            const updatedFeedback = selectedSubmission.feedback.filter((_, i) => i !== index);

            // Update local state
            setSelectedSubmission({
                ...selectedSubmission,
                feedback: updatedFeedback,
            });
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete comment'}`);
        }
    };

    const refreshSubmissionData = async (submissionId: string) => {
        try {
            const res = await fetch(`${API_URL}/api/submission/${submissionId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            // Update the submissions list with the refreshed data
            setSubmissions(submissions.map(s =>
                s.id === submissionId ? { ...s, feedback: data.feedback } : s
            ));
        } catch (error) {
            console.error('Error refreshing submission data:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Submissions Tracker</h1>

            {submissions.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No submission record of SAP or ASF</p>
                </div>
            ) : (
                <div>
                    {/* Status Filter Buttons */}
                    <div className="mb-6 flex flex-wrap gap-2">
                        {allStatuses.map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status === 'All' ? 'all' : status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${statusFilter === (status === 'All' ? 'all' : status)
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        {filteredSubmissions.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">None</p>
                            </div>
                        ) : (
                            filteredSubmissions.map((submission) => (
                                <div key={submission.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                    {submission.type}
                                                </span>
                                                <h3 className="text-lg font-semibold text-gray-900">{submission.activityName}</h3>
                                            </div>
                                            <p className="text-sm text-gray-600">{submission.affiliateName} • Submitted on {formatDate(submission.submittedAt)}</p>
                                        </div>
                                        <span className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(submission.status)}`}>
                                            {getStatusIcon(submission.status)}
                                            <span>{submission.status}</span>
                                        </span>
                                    </div>

                                    <div className="mb-4">
                                        <div className="mb-6">
                                            {/* Numbered Progress Bar */}
                                            <div className="w-full">
                                                {/* Determine which steps are completed */}
                                                {(() => {
                                                    let completedSteps = 0;
                                                    if (submission.status === 'Pending Validation') completedSteps = 1;
                                                    else if (submission.status === 'Awaiting INTIMA Review') completedSteps = 2;
                                                    else if (submission.status === 'Requires Amendment') completedSteps = 3;
                                                    else if (submission.status === 'Approved' || submission.status === 'Rejected') completedSteps = 4;

                                                    return (
                                                        <div>
                                                            {/* Progress circles and lines container */}
                                                            <div className="flex justify-between items-start mb-6">
                                                                {[1, 2, 3, 4].map((step) => (
                                                                    <div key={step} className="flex flex-col items-center flex-1">
                                                                        {/* Circle */}
                                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${step <= completedSteps ? 'bg-red-600' : step === completedSteps + 1 ? 'pulse-red-next bg-red-100' : 'bg-gray-300'}`}>
                                                                            {step}
                                                                        </div>

                                                                        {/* Line after circle (except for last step) */}
                                                                        {step < 4 && (
                                                                            <div className={`h-1 flex-1 transition-all -mx-2 mt-4 -mb-4 ${step < completedSteps ? 'bg-red-600' : 'bg-gray-300'}`} style={{ width: 'calc(100% + 16px)' }}></div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Labels */}
                                                            <div className="flex justify-between items-start">
                                                                {[
                                                                    'Pending Validation',
                                                                    'INTIMA Review',
                                                                    'Amendments',
                                                                    'Final Verdict'
                                                                ].map((label) => (
                                                                    <div key={label} className="flex-1 text-center">
                                                                        <p className="text-xs text-gray-600">{label}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    {submission.feedback && (
                                        Array.isArray(submission.feedback) && submission.feedback.length > 0
                                            ? (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                    <div className="flex items-start space-x-3">
                                                        <MessageSquare className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-semibold text-blue-900">Feedback</p>
                                                            <p className="text-sm text-blue-800">{submission.feedback[submission.feedback.length - 1].text}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                            : typeof submission.feedback === 'string' && submission.feedback.trim()
                                                ? (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                        <div className="flex items-start space-x-3">
                                                            <MessageSquare className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                                                            <div>
                                                                <p className="font-semibold text-blue-900">Feedback</p>
                                                                <p className="text-sm text-blue-800">{submission.feedback}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                                : null
                                    )}

                                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={async () => {
                                                setDetailLoading(true);
                                                try {
                                                    const res = await fetch(`${API_URL}/api/submission/${submission.id}`);
                                                    if (!res.ok) throw new Error('Failed to fetch');
                                                    const data = await res.json();
                                                    setSelectedSubmission(data);
                                                } catch (err) {
                                                    console.error('Failed to fetch submission detail:', err);
                                                } finally {
                                                    setDetailLoading(false);
                                                }
                                            }}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>View Details</span>
                                        </button>
                                        {submission.documents && submission.documents.length > 0 && (
                                            <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                <Download className="w-4 h-4" />
                                                <span>Download</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modal for details */}
            {selectedSubmission && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/30 z-50"
                    onClick={() => {
                        refreshSubmissionData(selectedSubmission.id);
                        setSelectedSubmission(null);
                    }}
                >
                    <div
                        className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[60vh] overflow-y-auto p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {detailLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader className="w-6 h-6 animate-spin text-red-600" />
                            </div>
                        ) : (
                            <div>
                                {/* Header with close button and title on same line */}
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedSubmission.activityName}</h2>
                                    <button
                                        onClick={() => {
                                            refreshSubmissionData(selectedSubmission.id);
                                            setSelectedSubmission(null);
                                        }}
                                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none ml-4"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Affiliate Name - Small, Italic */}
                                <p className="text-sm italic text-gray-500 mb-4">{selectedSubmission.affiliateName}</p>

                                {/* Horizontal Gray Line */}
                                <div className="border-t border-gray-300 mb-6"></div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {/* Type Section */}
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-1">Type</p>
                                        <p className="text-base font-bold text-gray-900">{selectedSubmission.type}</p>
                                    </div>

                                    {/* Status Section */}
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-1">Status</p>
                                        <p className="text-base font-bold text-gray-900">{selectedSubmission.status}</p>
                                    </div>

                                    {/* Date Section */}
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-1">Date</p>
                                        <p className="text-base font-bold text-gray-900">{formatDate(selectedSubmission.submittedAt)}</p>
                                    </div>

                                    {/* Submitted By Section */}
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium mb-1">Submitted By</p>
                                        <p className="text-base font-bold text-gray-900">{selectedSubmission.submittedBy}</p>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Comments</h3>
                                    <div className="space-y-3 mb-4">
                                        {Array.isArray(selectedSubmission.feedback) && selectedSubmission.feedback.length > 0 ? (
                                            selectedSubmission.feedback.map((comment: any, index: number) => (
                                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-xs font-semibold text-gray-700">{comment.author || comment.authorId || 'Anonymous'}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs text-gray-500">{comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : ''}</p>
                                                            {currentUser && (comment.authorId === currentUser.id) && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(index)}
                                                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-700">{comment.text}</p>
                                                </div>
                                            ))
                                        ) : typeof selectedSubmission.feedback === 'string' && selectedSubmission.feedback.trim() ? (
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <p className="text-sm text-gray-700">{selectedSubmission.feedback}</p>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <p className="text-sm text-gray-500 italic">No comments yet</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reply Box */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter' && commentText.trim()) {
                                                    handleAddComment();
                                                }
                                            }}
                                            placeholder="Add a reply..."
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                        />
                                        <button
                                            onClick={() => {
                                                if (commentText.trim()) {
                                                    handleAddComment();
                                                }
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>

                                {/* Documents Section */}
                                {selectedSubmission.documents && selectedSubmission.documents.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Documents</h3>
                                        <div className="space-y-2">
                                            {selectedSubmission.documents.map((d: string, i: number) => (
                                                <a
                                                    key={i}
                                                    href={d}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    📄 {d.split('/').pop()}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
