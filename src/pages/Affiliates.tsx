import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { Affiliate } from '../types';
import { useState, useEffect } from 'react';
import API_URL from '../config';

export default function AffiliatesPage() {
    const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'Sports' | 'Academic' | 'Special Interest'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive' | 'Pending Approval'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Sports' as 'Sports' | 'Academic' | 'Special Interest',
        status: 'Active' as 'Active' | 'Inactive' | 'Pending Approval',
        memberCount: 0,
        advisorId: '',
        committeeMembers: ''
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const itemsPerPage = 10;

    // Fetch affiliates on component mount
    useEffect(() => {
        fetchAffiliates();
    }, []);

    const fetchAffiliates = async () => {
        try {
            const response = await fetch(`${API_URL}/api/affiliates`);
            if (response.ok) {
                const data = await response.json();
                setAffiliates(data);
            } else {
                showAlert('error', 'Failed to fetch affiliates');
            }
        } catch (error) {
            console.error('Error fetching affiliates:', error);
            showAlert('error', 'Error fetching affiliates');
        }
    };

    const showAlert = (type: 'success' | 'error', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: 'Sports',
            status: 'Active',
            memberCount: 0,
            advisorId: '',
            committeeMembers: ''
        });
    };

    const openEditModal = (affiliate: Affiliate) => {
        setSelectedAffiliate(affiliate);
        setFormData({
            name: affiliate.name,
            description: affiliate.description || '',
            category: affiliate.category,
            status: affiliate.status,
            memberCount: affiliate.memberCount,
            advisorId: affiliate.advisorId,
            committeeMembers: Array.isArray(affiliate.committeeMembers) ? affiliate.committeeMembers.join(', ') : ''
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedAffiliate(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'memberCount') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveAffiliate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.advisorId) {
            showAlert('error', 'Name and Advisor ID are required');
            return;
        }

        setLoading(true);
        try {
            const url = selectedAffiliate ? `${API_URL}/api/affiliates/${selectedAffiliate.id}` : `${API_URL}/api/affiliates`;
            const method = selectedAffiliate ? 'PUT' : 'POST';

            const payload = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                status: formData.status,
                memberCount: formData.memberCount,
                advisorId: formData.advisorId,
                committeeMembers: formData.committeeMembers
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id !== '')
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchAffiliates();
                showAlert('success', selectedAffiliate ? 'Affiliate updated successfully' : 'Affiliate created successfully');
                setIsModalOpen(false);
                resetForm();
            } else {
                const error = await response.json();
                showAlert('error', error.message || 'Failed to save affiliate');
            }
        } catch (error) {
            console.error('Error saving affiliate:', error);
            showAlert('error', 'Error saving affiliate');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (affiliate: Affiliate) => {
        setSelectedAffiliate(affiliate);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedAffiliate) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/affiliates/${selectedAffiliate.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchAffiliates();
                showAlert('success', 'Affiliate deleted successfully');
                setIsDeleteConfirmOpen(false);
                setSelectedAffiliate(null);
            } else {
                const error = await response.json();
                showAlert('error', error.message || 'Failed to delete affiliate');
            }
        } catch (error) {
            console.error('Error deleting affiliate:', error);
            showAlert('error', 'Error deleting affiliate');
        } finally {
            setLoading(false);
        }
    };

    // Filter and search
    const filteredAffiliates = affiliates.filter(affiliate => {
        const matchesSearch = affiliate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            affiliate.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            affiliate.advisorId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || affiliate.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || affiliate.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredAffiliates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAffiliates = filteredAffiliates.slice(startIndex, endIndex);

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Sports': return 'text-blue-600 bg-blue-50';
            case 'Academic': return 'text-purple-600 bg-purple-50';
            case 'Special Interest': return 'text-pink-600 bg-pink-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'text-green-600 bg-green-50';
            case 'Inactive': return 'text-gray-600 bg-gray-50';
            case 'Pending Approval': return 'text-yellow-600 bg-yellow-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Affiliate Management</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Affiliate</span>
                </button>
            </div>

            {/* Alert */}
            {alert && (
                <div className={`p-4 rounded-lg ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {alert.message}
                </div>
            )}

            {/* Affiliates Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="relative flex-1 min-w-xs">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, description or advisor..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value as any);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="all">All Categories</option>
                            <option value="Sports">Sports</option>
                            <option value="Academic">Academic</option>
                            <option value="Special Interest">Special Interest</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as any);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Pending Approval">Pending Approval</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advisor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedAffiliates.length > 0 ? (
                                paginatedAffiliates.map((affiliate) => (
                                    <tr key={affiliate.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{affiliate.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(affiliate.category)}`}>
                                                {affiliate.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(affiliate.status)}`}>
                                                {affiliate.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{affiliate.memberCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{affiliate.advisorId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(affiliate.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <button
                                                onClick={() => openEditModal(affiliate)}
                                                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(affiliate)}
                                                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 font-medium"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                <span>Delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No affiliates found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {filteredAffiliates.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredAffiliates.length)} of {filteredAffiliates.length} results
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

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"
                    onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {selectedAffiliate ? 'Edit Affiliate' : 'Create New Affiliate'}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAffiliate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    placeholder="Affiliate name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    placeholder="Affiliate description"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="Sports">Sports</option>
                                    <option value="Academic">Academic</option>
                                    <option value="Special Interest">Special Interest</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Pending Approval">Pending Approval</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Member Count</label>
                                <input
                                    type="number"
                                    name="memberCount"
                                    value={formData.memberCount}
                                    onChange={handleFormChange}
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Advisor ID</label>
                                <input
                                    type="text"
                                    name="advisorId"
                                    value={formData.advisorId}
                                    onChange={handleFormChange}
                                    placeholder="e.g., A001"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Committee Members (comma-separated)</label>
                                <textarea
                                    name="committeeMembers"
                                    value={formData.committeeMembers}
                                    onChange={handleFormChange}
                                    placeholder="S001, S002, S003"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteConfirmOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => {
                        setIsDeleteConfirmOpen(false);
                        setSelectedAffiliate(null);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Delete Affiliate</h2>
                            <button
                                onClick={() => {
                                    setIsDeleteConfirmOpen(false);
                                    setSelectedAffiliate(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to delete <strong>{selectedAffiliate?.name}</strong>? This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteConfirmOpen(false);
                                        setSelectedAffiliate(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                                >
                                    {loading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
