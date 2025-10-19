// User types
export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    role: 'student' | 'intima';
    affiliates: string[]; // Array of affiliate IDs
    permissions: string[]; // Array of permission strings
    createdAt: string;
    updatedAt: string;
}

// Affiliate types
export interface Affiliate {
    id: string;
    name: string;
    description?: string;
    category: 'Sports' | 'Academic' | 'Special Interest' | 'Service';
    status: 'Active' | 'Inactive' | 'Pending Approval';
    memberCount: number;
    advisorId: string;
    committeeMembers: string[]; // Array of student IDs
    createdAt: string;
    updatedAt: string;
}

// SAP and ASF Activity types
export type ActivityStatus = 'Pending Validation' | 'Awaiting INTIMA Review' | 'Requires Amendment' | 'Approved' | 'Rejected';
export type ActivityType = 'SAP' | 'ASF';

export interface SAP {
    id: string;
    affiliateId: string;
    activityName: string;
    date: string;
    description?: string;
    status: ActivityStatus;
    submittedBy: string; // student id
    comments?: string;
    fileUrl?: string;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface ASF {
    id: string;
    affiliateId: string;
    activityName: string;
    date: string;
    description?: string;
    status: ActivityStatus;
    submittedBy: string; // student id
    comments?: string;
    fileUrl?: string;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
}

// Activity Log type
export interface ActivityLog {
    id: string;
    userId: string;
    action: string;
    timestamp: string;
    relatedFormId?: string;
    formType?: 'sap' | 'asf';
    oldStatus?: string;
    newStatus?: string;
}

// Submission tracking type
export interface SubmissionRecord {
    id: string;
    submittedBy: string; // student id
    formType: 'SAP' | 'ASF';
    formId: string; // References SAP or ASF id
    submittedAt: string;
}

// UI-focused types (for displaying submissions in the UI)
export interface Submission {
    id: string;
    type: 'SAP' | 'ASF';
    affiliateId?: string;
    affiliateName: string;
    activityName: string;
    date: string;
    description?: string;
    status: ActivityStatus;
    documents: string[];
    feedback?: string | any[];
    submittedBy: string;
    submittedAt: string;
    updatedAt: string;
    financeReviewStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Not Required';
    financeComments?: any[];
    financeReviewedBy?: string;
    financeReviewedAt?: string;
    activitiesReviewStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Not Required';
    activitiesComments?: any[];
    activitiesReviewedBy?: string;
    activitiesReviewedAt?: string;
}

export interface SubmissionDetail extends Submission {
    affiliateId?: string;
}

