import { User, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Submission } from '../types';

interface FeedbackProps {
    submissions: Submission[];
    currentUser: any;
}

export default function Feedback({ submissions, currentUser }: FeedbackProps) {
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

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Feedback & Communication</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                    {submissions
                        .filter(s => s.feedback && (currentUser?.role === 'affiliate' || s.submittedBy === currentUser?.name))
                        .map((submission) => (
                            <div key={submission.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{submission.activityName}</h3>
                                        <p className="text-sm text-gray-600">{submission.affiliateName}</p>
                                    </div>
                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                                        {getStatusIcon(submission.status)}
                                        <span>{submission.status}</span>
                                    </span>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-red-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">INTIMA Activities Department</p>
                                            <p className="text-sm text-gray-700 mt-1">{submission.feedback}</p>
                                            <p className="text-xs text-gray-500 mt-2">{submission.submittedAt}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <button className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        Reply
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
