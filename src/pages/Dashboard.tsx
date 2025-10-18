import { FileText, Clock, AlertCircle, CheckCircle, Search, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Submission } from '../types';
import { useState } from 'react';

interface DashboardProps {
    submissions: Submission[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    setCurrentView: (view: 'login' | 'dashboard' | 'submission' | 'tracker' | 'submission-detail') => void;
    setSelectedSubmission: (submission: Submission | null) => void;
}

export default function Dashboard({ submissions, searchQuery, setSearchQuery, statusFilter, setStatusFilter, setCurrentView, setSelectedSubmission }: DashboardProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Format date helper function
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
            return dateString;
        }
    };

    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch = sub.affiliateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.activityName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

    // Calculate status counts
    const statusCounts = {
        'Pending Validation': submissions.filter(s => s.status === 'Pending Validation').length,
        'Awaiting INTIMA Review': submissions.filter(s => s.status === 'Awaiting INTIMA Review').length,
        'Requires Amendment': submissions.filter(s => s.status === 'Requires Amendment').length,
        'Approved': submissions.filter(s => s.status === 'Approved').length,
        'Rejected': submissions.filter(s => s.status === 'Rejected').length,
    };

    // Build trends data from actual submissions grouped by date
    const trendsByDate: Record<string, { total: number; approved: number }> = {};
    submissions.forEach(sub => {
        const date = new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!trendsByDate[date]) {
            trendsByDate[date] = { total: 0, approved: 0 };
        }
        trendsByDate[date].total += 1;
        if (sub.status === 'Approved') {
            trendsByDate[date].approved += 1;
        }
    });

    const chartData = Object.entries(trendsByDate)
        .map(([date, data]) => ({ name: date, submissions: data.total, approved: data.approved }))
        .slice(-7); // Show last 7 days

    const statusData = [
        { name: 'Pending Validation', value: statusCounts['Pending Validation'], color: '#eab308' },
        { name: 'Awaiting INTIMA Review', value: statusCounts['Awaiting INTIMA Review'], color: '#3b82f6' },
        { name: 'Requires Amendment', value: statusCounts['Requires Amendment'], color: '#f59e0b' },
        { name: 'Approved', value: statusCounts['Approved'], color: '#10b981' },
        { name: 'Rejected', value: statusCounts['Rejected'], color: '#ef4444' },
    ].filter(item => item.value > 0);

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
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{submissions.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending Validation</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts['Pending Validation']}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">INTIMA Review</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts['Awaiting INTIMA Review']}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Requires Amendment</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts['Requires Amendment']}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts['Approved']}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Rejected</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{statusCounts['Rejected']}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Trends</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip contentStyle={{ border: 'none', borderRadius: '8px', backgroundColor: '#f3f4f6' }} />
                            <Line type="monotone" dataKey="submissions" stroke="#dc2626" strokeWidth={2} />
                            <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ border: 'none', borderRadius: '8px', backgroundColor: '#f3f4f6' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-4 mt-4 justify-center">
                        {statusData.map((item) => (
                            <div key={item.name} className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm text-gray-600">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* All Submissions with Pagination */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">All Submissions</h3>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            >
                                <option value="all">All Status</option>
                                <option value="Pending Validation">Pending Validation</option>
                                <option value="Awaiting INTIMA Review">Awaiting Review</option>
                                <option value="Requires Amendment">Requires Amendment</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedSubmissions.map((submission) => (
                                <tr key={submission.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                            {submission.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{submission.affiliateName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{submission.activityName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(submission.date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                                            {getStatusIcon(submission.status)}
                                            <span>{submission.status}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => {
                                                setSelectedSubmission(submission);
                                                setCurrentView('submission-detail');
                                            }}
                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {filteredSubmissions.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredSubmissions.length)} of {filteredSubmissions.length} results
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                    ? 'bg-red-600 text-white'
                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
