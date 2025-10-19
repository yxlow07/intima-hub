import React, { useState } from 'react';
import { Upload, FileText, XCircle, Send, AlertCircle, FileCheck, Loader } from 'lucide-react';
import { Affiliate } from '../types';

interface SubmissionProps {
    formData: {
        type: 'SAP' | 'ASF';
        affiliateId: string;
        activityName: string;
        date: string;
        description: string;
    };
    setFormData: (formData: any) => void;
    validationErrors: string[];
    uploadedFiles: File[];
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setUploadedFiles: (files: File[]) => void;
    handleSubmit: () => void;
    setCurrentView: (view: 'login' | 'dashboard' | 'submission' | 'tracker') => void;
    affiliates: Affiliate[];
    isSubmitting?: boolean;
}

export default function Submission({ formData, setFormData, validationErrors, uploadedFiles, handleFileUpload, setUploadedFiles, handleSubmit, setCurrentView, affiliates, isSubmitting = false }: SubmissionProps) {
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDropOrSelect = (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        let files: FileList | undefined;
        if (e instanceof DragEvent || 'dataTransfer' in e) {
            files = (e as React.DragEvent).dataTransfer.files;
        } else {
            files = (e as React.ChangeEvent<HTMLInputElement>).target.files || undefined;
        }

        if (files) {
            const fileArray = Array.from(files);
            const pdfFiles = fileArray.filter(file => file.type === 'application/pdf');

            if (pdfFiles.length > 0) {
                handleFileUpload({ target: { files: pdfFiles } } as any);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">New Submission</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Affiliate</label>
                    <select
                        value={formData.affiliateId}
                        onChange={(e) => setFormData({ ...formData, affiliateId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                        <option value="" disabled>-- Select an affiliate --</option>
                        {affiliates.map((affiliate) => (
                            <option key={affiliate.id} value={affiliate.id}>
                                {affiliate.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Submission Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setFormData({ ...formData, type: 'SAP' })}
                            className={`p-4 rounded-lg border-2 transition-all ${formData.type === 'SAP'
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <FileText className="w-8 h-8 mx-auto mb-2 text-red-600" />
                            <p className="font-medium">SAP</p>
                            <p className="text-xs text-gray-500 mt-1">Student Activity Proposal</p>
                        </button>
                        <button
                            onClick={() => setFormData({ ...formData, type: 'ASF' })}
                            className={`p-4 rounded-lg border-2 transition-all ${formData.type === 'ASF'
                                ? 'border-red-500 bg-red-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <FileCheck className="w-8 h-8 mx-auto mb-2 text-red-600" />
                            <p className="font-medium">ASF</p>
                            <p className="text-xs text-gray-500 mt-1">Activity Summary Form</p>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Activity Name</label>
                        <input
                            type="text"
                            value={formData.activityName}
                            onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Enter activity name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Activity Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Provide a brief description of the activity..."
                    />
                </div>

                <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents</label>
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDropOrSelect}
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
                            multiple
                            accept=".pdf"
                            onChange={handleDropOrSelect}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                        >
                            Select Files
                        </label>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {uploadedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="w-5 h-5 text-gray-600" />
                                        <span className="text-sm text-gray-900">{file.name}</span>
                                    </div>
                                    <button
                                        onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {validationErrors.length > 0 && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
                                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                    {validationErrors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={() => setCurrentView('tracker')}
                        disabled={isSubmitting}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Submit</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
