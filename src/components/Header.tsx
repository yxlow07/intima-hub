import { LogOut, Menu, X } from 'lucide-react';
import { User } from '../types';
import logo from '../images/logo.png';

interface HeaderProps {
    currentUser: User | null;
    handleLogout: () => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (isOpen: boolean) => void;
}

export default function Header({ currentUser, handleLogout, isMobileMenuOpen, setIsMobileMenuOpen }: HeaderProps) {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <div className="flex items-center space-x-3">
                            <div className="mt-3 w-10 h-10 rounded-lg flex items-center justify-center">
                                <img src={logo} alt="INTIMA Hub" className="w-10 h-10" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">INTIMA Hub</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Welcome, {currentUser?.name}</span>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </header>
    );
}
