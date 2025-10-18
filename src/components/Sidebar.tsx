import { X, LogOut } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
    currentUser: User | null;
    handleLogout: () => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
    setCurrentView: (view: 'login' | 'dashboard' | 'submission' | 'tracker') => void;
    currentView: string;
}

export default function Sidebar({ currentUser, handleLogout, isMobileMenuOpen, setIsMobileMenuOpen, setCurrentView, currentView }: SidebarProps) {
    return (
        <>
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        {currentUser?.role === 'intima' ? (
                            <>
                                <button
                                    onClick={() => setCurrentView('dashboard')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentView === 'dashboard'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Dashboard
                                </button>
                                <button
                                    onClick={() => setCurrentView('submission')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentView === 'submission'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Submissions
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setCurrentView('tracker')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentView === 'tracker'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    My Tracker
                                </button>
                                <button
                                    onClick={() => setCurrentView('submission')}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentView === 'submission'
                                        ? 'border-red-500 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    New Submission
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold text-gray-900">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)}>
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-600 mb-4">Welcome, {currentUser?.name}</p>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
