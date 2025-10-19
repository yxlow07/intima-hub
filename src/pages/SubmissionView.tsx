import { useState, useEffect } from 'react';
import { ChevronLeft, Download, CheckCircle, AlertCircle, Clock, XCircle, Upload, X } from 'lucide-react';
import { Submission, User } from '../types';
import API_URL from '../config';

interface SubmissionViewProps {
    submissionId: string;
    currentUser: User | null;
    setCurrentView: (view: 'login' | 'dashboard' | 'submission' | 'tracker' | 'submission-detail' | 'submission-view') => void;
}

// Utility function to get current UTC+8 timestamp
const getUTC8Timestamp = (): string => {
    const now = new Date();
    const utc8 = new Date(now.getTime() + (8 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
    return utc8.toISOString();
};

export default function SubmissionView({ submissionId, currentUser, setCurrentView }: SubmissionViewProps) {
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [pdfExists, setPdfExists] = useState<boolean>(true);
    const [pdfLoading, setPdfLoading] = useState<boolean>(false);
    const [iframeError, setIframeError] = useState<boolean>(false);
    const [commentText, setCommentText] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [amendmentFile, setAmendmentFile] = useState<File | null>(null);
    const [amendmentComment, setAmendmentComment] = useState('');
    const [isSubmittingAmendment, setIsSubmittingAmendment] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Fetch submission details on mount
    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const response = await fetch(`${API_URL}/api/submission/${submissionId}`);
                if (response.ok) {
                    const data = await response.json();
                    setSubmission(data);
                    setSelectedPdf(data.documents?.[0] || null);
                } else {
                    console.error('Failed to fetch submission');
                }
            } catch (error) {
                console.error('Error fetching submission:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [submissionId]);

    // Check if PDF exists when selected
    useEffect(() => {
        if (selectedPdf) {
            setPdfLoading(true);
            setIframeError(false);
            setPdfExists(true);

            fetch(`${API_URL}/api/check-file`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filePath: selectedPdf
                })
            })
                .then(response => response.json())
                .then(data => {
                    setPdfExists(data.exists);
                })
                .catch(error => {
                    console.error('Error checking file:', error);
                    setPdfExists(false);
                })
                .finally(() => {
                    setPdfLoading(false);
                });
        } else {
            setPdfExists(false);
        }
    }, [selectedPdf]);

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

    const formatDateOnly = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

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

    const handleAddComment = async () => {
        if (!commentText.trim() || !submission || !currentUser) return;

        setIsAddingComment(true);
        try {
            const response = await fetch(`${API_URL}/api/submission/${submission.id}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    formType: submission.type,
                    text: commentText,
                    userId: currentUser.id,
                    userName: currentUser.name,
                }),
            });

            if (!response.ok) throw new Error('Failed to add comment');

            // Update local submission with new comment
            const newComment = {
                author: currentUser.name,
                authorId: currentUser.id,
                text: commentText,
                timestamp: getUTC8Timestamp(),
            };

            const updatedFeedback = Array.isArray(submission.feedback)
                ? [...submission.feedback, newComment]
                : [newComment];

            setSubmission({
                ...submission,
                feedback: updatedFeedback,
            });

            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment');
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleDeleteComment = async (index: number) => {
        if (!submission || !Array.isArray(submission.feedback) || !currentUser) return;

        try {
            const response = await fetch(`${API_URL}/api/submission/${submission.id}/comment`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    formType: submission.type,
                    commentIndex: index,
                    userId: currentUser.id,
                }),
            });

            if (!response.ok) throw new Error('Failed to delete comment');

            const updatedFeedback = submission.feedback.filter((_, i) => i !== index);
            setSubmission({
                ...submission,
                feedback: updatedFeedback,
            });
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete comment'}`);
        }
    };

    const handleDownload = (filename: string) => {
        const link = document.createElement('a');
        link.href = `${API_URL}${filename}`;
        link.download = filename.split('/').pop() || 'document';
        link.click();
    };

    const handleDragFile = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDropOrSelectAmendment = (e: React.DragEvent<HTMLDivElement> | React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        let files: FileList | null = null;

        if ('dataTransfer' in e) {
            files = (e as React.DragEvent<HTMLDivElement>).dataTransfer.files;
        } else {
            files = (e as React.ChangeEvent<HTMLInputElement>).target.files;
        }

        if (files && files.length > 0) {
            setAmendmentFile(files[0]);
        }
    };

    const handleSubmitAmendment = async () => {
        if (!amendmentFile || !amendmentComment.trim() || !submission || !currentUser) {
            alert('Please upload a document and add a comment');
            return;
        }

        setIsSubmittingAmendment(true);
        try {
            // Step 1: Upload the amended file
            const formData = new FormData();
            formData.append('file', amendmentFile);
            formData.append('type', submission.type);
            formData.append('activityName', submission.activityName);
            formData.append('date', submission.date || new Date().toISOString().split('T')[0]);
            formData.append('isAmendment', 'true');

            const uploadResponse = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error('Failed to upload amended document');
            const uploadData = await uploadResponse.json();
            const newFilePath = uploadData.filePath;

            // Step 2: Update submission with new document, amendment comment, and status change to "Awaiting INTIMA Review"
            const updateResponse = await fetch(`${API_URL}/api/submission/${submission.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    formType: submission.type,
                    status: 'Awaiting INTIMA Review',
                    userId: currentUser.id,
                    newDocument: newFilePath,
                    amendmentComment: `[AMENDMENT] ${amendmentComment}`,
                }),
            });

            if (!updateResponse.ok) throw new Error('Failed to submit amendment');

            // Update local state
            const updatedFeedback = Array.isArray(submission.feedback)
                ? [...submission.feedback, {
                    author: 'System',
                    authorId: currentUser.id,
                    text: `[AMENDMENT] ${amendmentComment}`,
                    timestamp: getUTC8Timestamp(),
                }]
                : [{
                    author: 'System',
                    authorId: currentUser.id,
                    text: `[AMENDMENT] ${amendmentComment}`,
                    timestamp: getUTC8Timestamp(),
                }];

            const updatedDocuments = Array.isArray(submission.documents)
                ? [...submission.documents, newFilePath].filter(doc => doc && doc !== null && doc !== undefined)
                : [newFilePath];

            setSubmission({
                ...submission,
                status: 'Awaiting INTIMA Review',
                feedback: updatedFeedback,
                documents: updatedDocuments,
                updatedAt: getUTC8Timestamp(),
            });

            // Reset amendment form
            setAmendmentFile(null);
            setAmendmentComment('');
            alert('Amendment submitted successfully!');
        } catch (error) {
            console.error('Error submitting amendment:', error);
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to submit amendment'}`);
        } finally {
            setIsSubmittingAmendment(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">Loading submission...</p>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-500">Submission not found</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Back Button */}
            <button
                onClick={() => setCurrentView('tracker')}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium mb-6"
            >
                <ChevronLeft className="w-5 h-5" />
                Back to Tracker
            </button>

            <div>
                {/* Main Content */}
                <div>
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{submission.activityName}</h1>
                        <p className="text-sm italic text-gray-500 mb-4">{submission.affiliateName}</p>

                        <div className="border-t border-gray-300 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-1">Type</p>
                                    <p className="text-base font-bold text-gray-900">{submission.type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-1">Status</p>
                                    <span className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(submission.status)}`}>
                                        {getStatusIcon(submission.status)}
                                        <span>{submission.status}</span>
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-1">Activity Date</p>
                                    <p className="text-base font-bold text-gray-900">{formatDateOnly(submission.date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-1">Submitted</p>
                                    <p className="text-base font-bold text-gray-900">{formatDate(submission.submittedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {submission.description && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{submission.description}</p>
                        </div>
                    )}

                    {/* Documents Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Documents</h3>
                        <div className="space-y-2">
                            {submission.documents && submission.documents.length > 0 ? (
                                submission.documents.filter((doc: any) => doc).map((doc: string, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-sm font-medium text-gray-900 truncate">{doc?.split('/').pop() || 'Unknown'}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No documents uploaded</p>
                            )}
                        </div>
                    </div>

                    {/* PDF Viewer - Full Width Below Documents */}
                    <div className="bg-white h-screen rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Document Preview</h3>

                        {/* Document Selector */}
                        {submission.documents && submission.documents.filter((doc: any) => doc).length > 1 && (
                            <div className="mb-4">
                                <select
                                    value={selectedPdf || ''}
                                    onChange={(e) => setSelectedPdf(e.target.value || null)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    {submission.documents.filter((doc: any) => doc).map((doc: string) => (
                                        <option key={doc} value={doc}>
                                            {doc?.split('/').pop() || 'Unknown'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* PDF Viewer */}
                        <div className="flex-1 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center">
                            {pdfLoading ? (
                                <p className="text-gray-500 text-sm">Loading PDF...</p>
                            ) : iframeError || !pdfExists ? (
                                <p className="text-gray-500 text-sm text-center px-4">
                                    {!pdfExists ? 'Document not found' : 'Unable to display PDF'}
                                </p>
                            ) : (
                                <iframe
                                    src={`${API_URL}${selectedPdf}`}
                                    title="PDF Viewer"
                                    className="w-full h-full border-none m-0 p-0"
                                    onError={() => setIframeError(true)}
                                />
                            )}
                        </div>
                    </div>

                    {/* Validation Comments Section - Gemini AI Validation Results */}
                    {(() => {
                        // Parse comments if they're a string
                        let commentsList: any[] | null = submission.comments as any;
                        if (typeof commentsList === 'string') {
                            try {
                                commentsList = JSON.parse(commentsList);
                            } catch (e) {
                                commentsList = null;
                            }
                        }

                        // Check if we have validation comments
                        const hasValidationComments = commentsList && Array.isArray(commentsList) && commentsList.some((comment: any) => 'field' in comment && 'severity' in comment);

                        if (!hasValidationComments) return null;

                        return (
                            <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                    <h3 className="text-sm font-semibold text-gray-900">Validation Results</h3>
                                </div>

                                <div className="space-y-3">
                                    {commentsList!
                                        .filter((comment: any) => 'field' in comment && 'severity' in comment && 'message' in comment)
                                        .map((comment: any, index: number) => {
                                            // Determine severity color
                                            const severityColors: Record<string, string> = {
                                                'critical': 'bg-red-50 border-red-200 text-red-900',
                                                'major': 'bg-orange-50 border-orange-200 text-orange-900',
                                                'info': 'bg-blue-50 border-blue-200 text-blue-900',
                                                'minor': 'bg-yellow-50 border-yellow-200 text-yellow-900',
                                            };

                                            const severityIcons: Record<string, string> = {
                                                'critical': '🔴',
                                                'major': '🟠',
                                                'info': '🔵',
                                                'minor': '🟡',
                                            };

                                            const severityClass = severityColors[comment.severity] || severityColors['info'];
                                            const severityIcon = severityIcons[comment.severity] || severityIcons['info'];

                                            return (
                                                <div key={index} className={`border rounded-lg p-4 ${severityClass}`}>
                                                    <div className="flex gap-3">
                                                        <span className="text-lg flex-shrink-0">{severityIcon}</span>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <p className="text-sm font-semibold text-gray-900">{comment.field}</p>
                                                                <span className="text-xs font-medium px-2 py-1 rounded bg-white/50">
                                                                    {comment.severity.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 mb-2">{comment.message}</p>
                                                            {comment.suggested_fix && (
                                                                <p className="text-xs text-gray-600 italic">
                                                                    <strong>Fix:</strong> {comment.suggested_fix}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Amendment Section - Only show if status is "Requires Amendment" */}
                    {submission.status === 'Requires Amendment' && (
                        <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-6 mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                <h3 className="text-sm font-semibold text-gray-900">Submit Amended Document</h3>
                            </div>

                            <div className="space-y-4">
                                {/* File Upload with Drag and Drop */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Amended Document</label>
                                    <div
                                        onDragEnter={handleDragFile}
                                        onDragLeave={handleDragFile}
                                        onDragOver={handleDragFile}
                                        onDrop={handleDropOrSelectAmendment}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragActive
                                            ? 'border-red-500 bg-red-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                        <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to select</p>
                                        <p className="text-xs text-gray-500">PDF files up to 10MB</p>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleDropOrSelectAmendment}
                                            className="hidden"
                                            id="amendment-file-upload"
                                        />
                                        <label
                                            htmlFor="amendment-file-upload"
                                            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                                        >
                                            Select File
                                        </label>
                                    </div>

                                    {amendmentFile && (
                                        <div className="mt-3 flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <span className="text-sm text-gray-700 font-medium">{amendmentFile.name}</span>
                                            <button
                                                onClick={() => setAmendmentFile(null)}
                                                className="text-gray-500 hover:text-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Amendment Comment */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Amendment Notes</label>
                                    <textarea
                                        value={amendmentComment}
                                        onChange={(e) => setAmendmentComment(e.target.value)}
                                        placeholder="Describe the changes made in this amendment..."
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                        rows={3}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmitAmendment}
                                    disabled={!amendmentFile || !amendmentComment.trim() || isSubmittingAmendment}
                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition"
                                >
                                    {isSubmittingAmendment ? 'Submitting...' : 'Submit Amendment & Move to Review'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Comments Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Comments</h3>

                        {/* Add Comment Form */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                rows={3}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!commentText.trim() || isAddingComment}
                                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            >
                                {isAddingComment ? 'Adding...' : 'Add Comment'}
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                            {Array.isArray(submission.feedback) && submission.feedback.length > 0 ? (
                                [...submission.feedback]
                                    .filter((comment: any) => !('field' in comment && 'severity' in comment && 'message' in comment))
                                    .reverse()
                                    .map((comment: any) => {
                                        // Find the actual index in the original feedback array
                                        const actualIndex = Array.isArray(submission.feedback)
                                            ? submission.feedback.findIndex((c: any) => c === comment)
                                            : -1;
                                        return (
                                            <div key={actualIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-xs font-semibold text-gray-700">{comment.author || comment.authorId || 'Anonymous'}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs text-gray-500">{comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : ''}</p>
                                                        {currentUser && (comment.authorId === currentUser.id) && comment.author !== 'System' && (
                                                            <button
                                                                onClick={() => handleDeleteComment(actualIndex)}
                                                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-700">{comment.text}</p>
                                            </div>
                                        );
                                    })
                            ) : (
                                <p className="text-sm text-gray-500">No comments yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
