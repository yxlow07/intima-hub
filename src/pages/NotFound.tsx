import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center p-8 bg-white shadow-lg rounded-lg">
                <h1 className="text-6xl font-bold text-red-600">404</h1>
                <p className="text-2xl font-medium text-gray-800 mb-4">Page Not Found</p>
                <p className="text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
                <Link to="/" className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                    Go to Homepage
                </Link>
            </div>
        </div>
    );
}
