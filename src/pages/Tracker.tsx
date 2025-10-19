import { useState, useEffect } from 'react';
import { Eye, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Submission, User } from '../types';
import API_URL from '../config';

interface TrackerProps {
    currentUser: User | null;
    setCurrentView: (view: 'login' | 'dashboard' | 'submission' | 'tracker' | 'submission-view') => void;
    onSelectSubmission: (id: string) => void;
}

export default function Tracker({ currentUser, setCurrentView, onSelectSubmission }: TrackerProps) {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

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
    const filteredSubmissions = (statusFilter === 'all'
        ? submissions
        : submissions.filter(s => s.status === statusFilter))
        .sort((a, b) => {
            // Sort by updatedAt in descending order (most recent first)
            const dateA = new Date(a.updatedAt).getTime();
            const dateB = new Date(b.updatedAt).getTime();
            return dateB - dateA;
        });

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
                                                    else if (submission.status === 'Requires Amendment') completedSteps = 2;
                                                    else if (submission.status === 'Awaiting INTIMA Review') completedSteps = 3;
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
                                                                    'Amendments',
                                                                    'INTIMA Review',
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
                                            ? (() => {
                                                // Separate validation comments from user feedback
                                                const userFeedback = submission.feedback.filter((c: any) => !('field' in c && 'severity' in c && 'message' in c));
                                                const validationComments = submission.feedback.filter((c: any) => 'field' in c && 'severity' in c && 'message' in c);

                                                // Filter user feedback to only show comments from others (not from current user)
                                                const otherUserFeedback = userFeedback.filter((c: any) => c.authorId !== currentUser?.id);

                                                // Show feedback from others if available, otherwise show top validation result
                                                const displayComment = otherUserFeedback.length > 0
                                                    ? otherUserFeedback[otherUserFeedback.length - 1]
                                                    : validationComments[0];

                                                if (!displayComment) return null;

                                                const isValidation = 'field' in displayComment && 'severity' in displayComment;
                                                const severityColors: Record<string, string> = {
                                                    'critical': 'bg-red-50 border-red-200',
                                                    'major': 'bg-orange-50 border-orange-200',
                                                    'info': 'bg-blue-50 border-blue-200',
                                                    'minor': 'bg-yellow-50 border-yellow-200',
                                                };
                                                const displayClass = isValidation
                                                    ? severityColors[displayComment.severity] || 'bg-blue-50 border-blue-200'
                                                    : 'bg-blue-50 border-blue-200';

                                                return (
                                                    <div className={`${displayClass} border rounded-lg p-4 mb-4`}>
                                                        <div className="flex items-start space-x-3">
                                                            <div className="flex-1">
                                                                {isValidation ? (
                                                                    <>
                                                                        <p className="font-semibold text-gray-900">Validation error: {displayComment.field}</p>
                                                                        <p className="text-sm text-gray-700">{displayComment.message}</p>
                                                                        <p className="text-xs text-gray-600 mt-1"><strong>Fix:</strong> {displayComment.suggested_fix}</p>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <p className="font-semibold text-blue-900">Feedback from {displayComment.author || 'System'}</p>
                                                                        <p className="text-sm text-blue-800">{displayComment.text}</p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()
                                            : typeof submission.feedback === 'string' && submission.feedback.trim()
                                                ? (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                        <div className="flex items-start space-x-3">
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
                                            onClick={() => {
                                                onSelectSubmission(submission.id);
                                                setCurrentView('submission-view');
                                            }}
                                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>View Details</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
