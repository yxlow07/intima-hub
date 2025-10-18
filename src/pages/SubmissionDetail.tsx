import { useState, useEffect } from 'react';

import { Submission, User } from '../types';
import API_URL from '../config';

interface SubmissionDetailProps {
    submission: Submission;
    currentUser: User | null;
}

export default function SubmissionDetail({ submission, currentUser }: SubmissionDetailProps) {
    const [selectedPdf, setSelectedPdf] = useState<string | null>(submission.documents?.[0] || null);
    const [pdfExists, setPdfExists] = useState<boolean>(true);
    const [pdfLoading, setPdfLoading] = useState<boolean>(false);
    const [iframeError, setIframeError] = useState<boolean>(false);

    useEffect(() => {
        if (selectedPdf) {
            setPdfLoading(true);
            setIframeError(false);
            setPdfExists(true); // Assume it exists until proven otherwise

            // Use server endpoint to check if file exists using Node.js fs module
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
    const [newStatus, setNewStatus] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [signedFormFile, setSignedFormFile] = useState<File | null>(null);
    const [uploadingSignedForm, setUploadingSignedForm] = useState(false);

    // Department review states
    const [financeReviewStatus, setFinanceReviewStatus] = useState<string>('');
    const [financeReviewMessage, setFinanceReviewMessage] = useState<string>('');
    const [activitiesReviewStatus, setActivitiesReviewStatus] = useState<string>('');
    const [activitiesReviewMessage, setActivitiesReviewMessage] = useState<string>('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    // Fetch PDF as blob and convert to data URL

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
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
        const icons: Record<string, string> = {
            'Approved': '✓',
            'Requires Amendment': '⚠',
            'Awaiting INTIMA Review': '⏳',
            'Pending Validation': '⏳',
            'Rejected': '✕',
        };
        return icons[status] || '•';
    };

    const refreshSubmissionDetails = async () => {
        try {
            const response = await fetch(`${API_URL}/api/submission/${submission.id}`);
            if (response.ok) {
                const updatedSubmission = await response.json();
                // Update all submission fields
                Object.assign(submission, updatedSubmission);
                // Force re-render by triggering state update
                setSelectedPdf(updatedSubmission.documents?.[0] || null);
            }
        } catch (error) {
            console.error('Error refreshing submission details:', error);
        }
    };

    const handleStatusUpdate = async () => {
        if (!newStatus || !statusMessage.trim()) {
            alert('Please select a status and add a message');
            return;
        }

        // Require signed file for Approved or Rejected status
        if ((newStatus === 'Approved' || newStatus === 'Rejected') && !signedFormFile) {
            alert('Please upload the digitally signed form for this status change');
            return;
        }

        setIsUpdatingStatus(true);
        try {
            let signedFileUrl = null;

            // Upload signed form if provided
            if (signedFormFile) {
                setUploadingSignedForm(true);
                const formData = new FormData();
                formData.append('file', signedFormFile);

                const uploadResponse = await fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload signed form');
                }

                const uploadData = await uploadResponse.json();
                signedFileUrl = uploadData.path;
                setUploadingSignedForm(false);
            }

            const url = `${API_URL}/api/submissions/${submission.id}/status`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: newStatus,
                    message: statusMessage,
                    signedFormUrl: signedFileUrl,
                }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to update status');
            }

            // Refresh all submission details from the backend
            await refreshSubmissionDetails();

            // Reset form
            setNewStatus('');
            setStatusMessage('');
            setSignedFormFile(null);
            // Force a re-render to show updated files
            alert('Status updated successfully! The signed form has been added to your documents.');
        } catch (error) {
            console.error('Error updating status:', error);
            alert(`Failed to update status: ${(error as Error).message}`);
        } finally {
            setIsUpdatingStatus(false);
            setUploadingSignedForm(false);
        }
    };

    const handleDepartmentReviewSubmit = async () => {
        if (!financeReviewStatus && !activitiesReviewStatus) {
            alert('Please select at least one department review status');
            return;
        }

        setIsSubmittingReview(true);
        try {
            const url = `${API_URL}/api/submissions/${submission.id}/department-review`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    formType: submission.type,
                    financeReviewStatus: financeReviewStatus || undefined,
                    financeReviewMessage: financeReviewMessage || undefined,
                    activitiesReviewStatus: activitiesReviewStatus || undefined,
                    activitiesReviewMessage: activitiesReviewMessage || undefined,
                    userId: currentUser?.id || undefined,
                }),
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to submit department review');
            }

            // Refresh all submission details from the backend
            await refreshSubmissionDetails();

            // Reset form
            setFinanceReviewStatus('');
            setFinanceReviewMessage('');
            setActivitiesReviewStatus('');
            setActivitiesReviewMessage('');
            alert('Department review submitted successfully');
        } catch (error) {
            console.error('Error submitting department review:', error);
            alert(`Failed to submit review: ${(error as Error).message}`);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {/* Activity Name - Bold */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{submission.activityName}</h1>

            {/* Affiliate Name - Small, Italic */}
            <p className="text-base italic text-gray-500 mb-6">{submission.affiliateName}</p>

            {/* Horizontal Gray Line */}
            <div className="border-t border-gray-300 mb-8"></div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Submission ID</p>
                    <p className="text-xs font-semibold text-gray-900 mt-2 font-mono">{submission.id}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Submission Type</p>
                    <p className="text-sm font-semibold text-gray-900 mt-2">{submission.type}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Affiliate ID</p>
                    <p className="text-xs font-semibold text-gray-900 mt-2 font-mono">{submission.affiliateId || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Submitted By</p>
                    <p className="text-sm font-semibold text-gray-900 mt-2">{submission.submittedBy}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Activity Date</p>
                    <p className="text-sm font-semibold text-gray-900 mt-2">{formatDate(submission.date)}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Submitted On</p>
                    <p className="text-sm font-semibold text-gray-900 mt-2">{formatDate(submission.submittedAt)}</p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <div className="mt-2">
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(submission.status)}`}>
                            <span>{getStatusIcon(submission.status)}</span>
                            <span>{submission.status}</span>
                        </span>
                    </div>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Documents</p>
                    <p className="text-sm font-semibold text-gray-900 mt-2">{submission.documents?.length || 0} file(s)</p>
                </div>
                {submission.description && (
                    <div className="col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{submission.description}</p>
                    </div>
                )}
            </div>

            {/* Documents Section */}
            {submission.documents && submission.documents.length > 0 && (
                <div className="mb-8">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-4">Attached Documents</p>

                    {/* Document Tabs */}
                    <div className="flex gap-2 mb-4 flex-wrap">
                        {submission.documents.map((doc, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedPdf(doc);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPdf === doc
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                📄 {doc.split('/').pop()}
                            </button>
                        ))}
                    </div>

                    {/* PDF Viewer */}
                    {selectedPdf && (
                        <div className="mt-6 border border-gray-300 rounded-lg overflow-hidden h-[600px] flex items-center justify-center bg-gray-50">
                            {(() => {
                                if (pdfLoading) {
                                    return <p className="text-gray-500">Checking PDF...</p>;
                                } else if (pdfExists && !iframeError) {
                                    return (
                                        <iframe
                                            src={selectedPdf}
                                            className="w-full h-full"
                                            title="PDF Viewer"
                                            onError={() => {
                                                setIframeError(true);
                                            }}
                                        />
                                    );
                                } else {
                                    return (
                                        <div className="text-center p-8">
                                            <p className="text-red-600 font-medium mb-4">
                                                {!pdfExists ? 'PDF File Not Found' : 'Unable to Load PDF'}
                                            </p>
                                            <p className="text-gray-600 text-sm mb-4">
                                                {!pdfExists
                                                    ? 'The PDF file does not exist on the server. It may have been deleted or the file path is incorrect.'
                                                    : 'The PDF could not be displayed in the viewer. Please try downloading it instead.'}
                                            </p>
                                            {pdfExists && (
                                                <a
                                                    href={selectedPdf}
                                                    download
                                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                >
                                                    Download PDF
                                                </a>
                                            )}
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Department Review Section */}
            <div className="mb-8 border-t border-gray-300 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Department Reviews</h2>

                <div className="grid grid-cols-2 gap-8">
                    {/* Finance Department Review */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Finance Department</h3>

                        {submission.financeReviewStatus ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Status</p>
                                    <p className="text-lg font-bold text-blue-900">{submission.financeReviewStatus}</p>
                                </div>
                                {submission.financeReviewedBy && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">Reviewed By</p>
                                        <p className="text-sm text-gray-700">{submission.financeReviewedBy}</p>
                                    </div>
                                )}
                                {submission.financeReviewedAt && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">Reviewed On</p>
                                        <p className="text-sm text-gray-700">{formatDate(submission.financeReviewedAt)}</p>
                                    </div>
                                )}
                                {submission.financeComments && submission.financeComments.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">Comments</p>
                                        <div className="space-y-2">
                                            {submission.financeComments.map((comment: any, idx: number) => (
                                                <p key={idx} className="text-sm text-gray-700 bg-white p-2 rounded border border-blue-200">
                                                    {typeof comment === 'string' ? comment : comment.text || JSON.stringify(comment)}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 italic">Pending review</p>
                        )}
                    </div>

                    {/* Activities Department Review */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                        <h3 className="text-lg font-semibold text-purple-900 mb-4">Activities Department</h3>

                        {submission.activitiesReviewStatus ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Status</p>
                                    <p className="text-lg font-bold text-purple-900">{submission.activitiesReviewStatus}</p>
                                </div>
                                {submission.activitiesReviewedBy && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">Reviewed By</p>
                                        <p className="text-sm text-gray-700">{submission.activitiesReviewedBy}</p>
                                    </div>
                                )}
                                {submission.activitiesReviewedAt && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">Reviewed On</p>
                                        <p className="text-sm text-gray-700">{formatDate(submission.activitiesReviewedAt)}</p>
                                    </div>
                                )}
                                {submission.activitiesComments && submission.activitiesComments.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-2">Comments</p>
                                        <div className="space-y-2">
                                            {submission.activitiesComments.map((comment: any, idx: number) => (
                                                <p key={idx} className="text-sm text-gray-700 bg-white p-2 rounded border border-purple-200">
                                                    {typeof comment === 'string' ? comment : comment.text || JSON.stringify(comment)}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 italic">Pending review</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Department Review Input Section */}
            <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-lg border-2 border-dashed border-blue-300">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Submit Department Review</h2>

                <div className="grid grid-cols-2 gap-6">
                    {/* Finance Department Input */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-blue-900">Finance Department</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Review Status</label>
                            <select
                                value={financeReviewStatus}
                                onChange={(e) => setFinanceReviewStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Select Status --</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Not Required">Not Required</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                            <textarea
                                value={financeReviewMessage}
                                onChange={(e) => setFinanceReviewMessage(e.target.value)}
                                placeholder="Enter your review comments..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Activities Department Input */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-purple-900">Activities Department</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Review Status</label>
                            <select
                                value={activitiesReviewStatus}
                                onChange={(e) => setActivitiesReviewStatus(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">-- Select Status --</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Not Required">Not Required</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                            <textarea
                                value={activitiesReviewMessage}
                                onChange={(e) => setActivitiesReviewMessage(e.target.value)}
                                placeholder="Enter your review comments..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-blue-200">
                    <button
                        onClick={() => {
                            setFinanceReviewStatus('');
                            setFinanceReviewMessage('');
                            setActivitiesReviewStatus('');
                            setActivitiesReviewMessage('');
                        }}
                        disabled={isSubmittingReview}
                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleDepartmentReviewSubmit}
                        disabled={isSubmittingReview || (!financeReviewStatus && !activitiesReviewStatus)}
                        className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>

            {/* Status Update Section */}
            <div className="mb-8 border-t border-gray-300 pt-8">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Update Status</h2>

                <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                    {/* Current Status Display */}
                    <div className="pb-6 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-600 mb-2 uppercase">Current Status</p>
                        <span className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                            <span>{getStatusIcon(submission.status)}</span>
                            <span>{submission.status}</span>
                        </span>
                    </div>

                    {/* Status Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            New Status
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {['Approved', 'Requires Amendment', 'Rejected'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setNewStatus(status)}
                                    className={`p-4 rounded-lg border-2 transition-colors text-sm font-medium ${newStatus === status
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="mr-2">{getStatusIcon(status)}</span>
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Message/Feedback <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={statusMessage}
                            onChange={(e) => setStatusMessage(e.target.value)}
                            placeholder="Enter your feedback or reason for this status change..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            This message will be added to the submission's feedback/comments
                        </p>
                    </div>

                    {/* Signed Form Upload - Only show for Approved or Rejected */}
                    {(newStatus === 'Approved' || newStatus === 'Rejected') && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Digitally Signed Form <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-600 mb-3">
                                Please upload the digitally signed approval/rejection form to complete this status change.
                            </p>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        if (e.target.files[0].type !== 'application/pdf') {
                                            alert('Only PDF files are allowed');
                                            e.target.value = '';
                                            setSignedFormFile(null);
                                        } else {
                                            setSignedFormFile(e.target.files[0]);
                                        }
                                    }
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors"
                            />
                            {signedFormFile && (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-700">
                                        ✓ Selected: <span className="font-medium">{signedFormFile.name}</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => {
                                setNewStatus('');
                                setStatusMessage('');
                                setSignedFormFile(null);
                            }}
                            disabled={isUpdatingStatus}
                            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStatusUpdate}
                            disabled={isUpdatingStatus || uploadingSignedForm || !newStatus || !statusMessage.trim() || ((newStatus === 'Approved' || newStatus === 'Rejected') && !signedFormFile)}
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isUpdatingStatus || uploadingSignedForm ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Feedback/Comments Section */}
            {submission.feedback && (
                <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-4">Feedback</p>
                    <div className="bg-gray-50 p-6 rounded-lg">
                        {typeof submission.feedback === 'string' ? (
                            <p className="text-sm text-gray-700">{submission.feedback}</p>
                        ) : Array.isArray(submission.feedback) ? (
                            <div className="space-y-4">
                                {submission.feedback.map((comment: any, idx: number) => (
                                    <div key={idx} className="border-l-2 border-gray-300 pl-4">
                                        <p className="text-sm font-medium text-gray-900">{comment.author || 'Anonymous'}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(comment.timestamp).toLocaleString()}</p>
                                        <p className="text-sm text-gray-700 mt-2">{comment.text}</p>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
