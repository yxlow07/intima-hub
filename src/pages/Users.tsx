import { Plus, Edit2, Trash2, Search, Shield, User as UserIcon, X } from 'lucide-react';
import { User } from '../types';
import { useState, useEffect } from 'react';
import API_URL from '../config';
import { fetchWithHeaders } from '../utils/fetch';

interface UsersPageProps {
    currentUser: User | null;
}

export default function UsersPage({ }: UsersPageProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [affiliateSearch, setAffiliateSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'intima'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isAffiliateDropdownOpen, setIsAffiliateDropdownOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student' as 'student' | 'intima',
        selectedAffiliates: [] as string[]
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const itemsPerPage = 10;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.affiliate-dropdown')) {
                setIsAffiliateDropdownOpen(false);
            }
        };

        if (isAffiliateDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isAffiliateDropdownOpen]);

    // Fetch users and affiliates on component mount
    useEffect(() => {
        fetchUsers();
        fetchAffiliates();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetchWithHeaders(`${API_URL}/api/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                showAlert('error', 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showAlert('error', 'Error fetching users');
        }
    };

    const fetchAffiliates = async () => {
        try {
            const response = await fetchWithHeaders(`${API_URL}/api/affiliates`);
            if (response.ok) {
                const data = await response.json();
                setAffiliates(data);
            } else {
                console.error('Failed to fetch affiliates');
            }
        } catch (error) {
            console.error('Error fetching affiliates:', error);
        }
    };

    const showAlert = (type: 'success' | 'error', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 3000);
    };

    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'student',
            selectedAffiliates: []
        });
        setAffiliateSearch('');
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            id: user.id,
            name: user.name,
            email: user.email,
            password: '',
            confirmPassword: '',
            role: user.role,
            selectedAffiliates: user.affiliates || []
        });
        setAffiliateSearch('');
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedUser(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            showAlert('error', 'Name and email are required');
            return;
        }

        if (selectedUser === null && !formData.password) {
            showAlert('error', 'Password is required for new users');
            return;
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            showAlert('error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const url = selectedUser ? `${API_URL}/api/users/${selectedUser.id}` : `${API_URL}/api/users`;
            const method = selectedUser ? 'PUT' : 'POST';

            const payload: any = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                affiliates: formData.selectedAffiliates
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (!selectedUser) {
                payload.id = formData.id;
            } else if (formData.id !== selectedUser.id) {
                // If user ID changed, update it
                payload.newId = formData.id;
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await fetchUsers();
                showAlert('success', selectedUser ? 'User updated successfully' : 'User created successfully');
                setIsModalOpen(false);
                resetForm();
            } else {
                const error = await response.json();
                showAlert('error', error.message || 'Failed to save user');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            showAlert('error', 'Error saving user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            const response = await fetchWithHeaders(`${API_URL}/api/users/${selectedUser.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchUsers();
                showAlert('success', 'User deleted successfully');
                setIsDeleteConfirmOpen(false);
                setSelectedUser(null);
            } else {
                const error = await response.json();
                showAlert('error', error.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showAlert('error', 'Error deleting user');
        } finally {
            setLoading(false);
        }
    };

    // Filter and search
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const getRoleColor = (role: string) => {
        return role === 'intima' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50';
    };

    const getRoleIcon = (role: string) => {
        return role === 'intima' ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add User</span>
                </button>
            </div>

            {/* Alert */}
            {alert && (
                <div className={`p-4 rounded-lg ${alert.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {alert.message}
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email or ID..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-full"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value as any);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            <option value="all">All Roles</option>
                            <option value="student">Student</option>
                            <option value="intima">INTIMA Admin</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                                                {getRoleIcon(user.role)}
                                                <span className="capitalize">{user.role}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(user)}
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
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Showing {filteredUsers.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} results
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
                                {selectedUser ? 'Edit User' : 'Create New User'}
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

                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                                <input
                                    type="text"
                                    name="id"
                                    value={formData.id}
                                    onChange={handleFormChange}
                                    placeholder="e.g., S123456"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    placeholder="Full name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleFormChange}
                                    placeholder="user@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    <option value="student">Student</option>
                                    <option value="intima">INTIMA Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliates</label>
                                <div className="relative affiliate-dropdown">
                                    <button
                                        type="button"
                                        onClick={() => setIsAffiliateDropdownOpen(!isAffiliateDropdownOpen)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-red-500 focus:border-transparent flex items-center justify-between"
                                    >
                                        <span className="text-sm">
                                            {formData.selectedAffiliates.length === 0
                                                ? 'Select affiliates...'
                                                : `${formData.selectedAffiliates.length} selected`}
                                        </span>
                                        <X className="w-4 h-4 text-gray-400" />
                                    </button>

                                    {isAffiliateDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                                            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                                                <input
                                                    type="text"
                                                    placeholder="Search affiliates..."
                                                    value={affiliateSearch}
                                                    onChange={(e) => setAffiliateSearch(e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                                                />
                                            </div>
                                            <div className="p-2 space-y-1">
                                                {affiliates
                                                    .filter(aff => aff.name.toLowerCase().includes(affiliateSearch.toLowerCase()))
                                                    .map(affiliate => (
                                                        <label key={affiliate.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.selectedAffiliates.includes(affiliate.id)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            selectedAffiliates: [...prev.selectedAffiliates, affiliate.id]
                                                                        }));
                                                                    } else {
                                                                        setFormData(prev => ({
                                                                            ...prev,
                                                                            selectedAffiliates: prev.selectedAffiliates.filter(id => id !== affiliate.id)
                                                                        }));
                                                                    }
                                                                }}
                                                                className="w-4 h-4 text-red-600 rounded"
                                                            />
                                                            <span className="ml-2 text-sm text-gray-700">{affiliate.name}</span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {formData.selectedAffiliates.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {formData.selectedAffiliates.map(affiliateId => {
                                            const aff = affiliates.find(a => a.id === affiliateId);
                                            return (
                                                <span key={affiliateId} className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                                                    {aff?.name}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                selectedAffiliates: prev.selectedAffiliates.filter(id => id !== affiliateId)
                                                            }));
                                                        }}
                                                        className="hover:text-red-900"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password {selectedUser && '(leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleFormChange}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    required={!selectedUser}
                                />
                            </div>

                            {formData.password && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleFormChange}
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            )}

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
                    className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => {
                        setIsDeleteConfirmOpen(false);
                        setSelectedUser(null);
                    }}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
                            <button
                                onClick={() => {
                                    setIsDeleteConfirmOpen(false);
                                    setSelectedUser(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteConfirmOpen(false);
                                        setSelectedUser(null);
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
