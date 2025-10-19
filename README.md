# INTIMA Hub - Activity Submission & Review Management System

A comprehensive web application for managing student activity submissions (SAP - Student Activity Proposal & ASF - Activity Summary Form) with a multi-tier review system for educational affiliates and administrative bodies.

## 🎯 Project Overview

INTIMA Hub is a full-stack application designed to streamline the submission and review process for student activities. It provides role-based access for students and INTIMA administrators, with integrated departmental review workflows for Finance and Activities departments.

### Key Features

- **Dual Submission Types**: Support for SAP (Student Activity Proposal) and ASF (Activity Summary Form)
- **Role-Based Access**: Separate interfaces for Students and INTIMA Administrators
- **Multi-Department Reviews**: Finance and Activities department review workflows
- **PDF Document Management**: Upload and store multiple PDF files per submission
- **Status Tracking**: Comprehensive status workflow (Pending Validation → Awaiting INTIMA Review → Approved/Rejected/Requires Amendment)
- **Amendment Workflow**: Students can submit amended documents when requesting amendments with drag-and-drop interface
- **Real-Time Updates**: UI automatically refreshes with latest submission details
- **Digitally Signed Forms**: Support for uploading digitally signed approval/rejection forms
- **Advanced Analytics**: Dashboard with charts showing submission statistics
- **Sorted Submissions**: Submissions sorted by most recently updated first
- **UTC+8 Timezone**: Consistent timestamp handling across all operations
- **Enhanced UI/UX**:
  - Dedicated submission detail page with full-width PDF viewer
  - Drag-and-drop file uploads with visual feedback
  - Responsive dropdown for document selection
  - Newest comments displayed first
  - System messages protected from deletion

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [User Roles & Workflows](#user-roles--workflows)
6. [Installation & Setup](#installation--setup)
7. [Running the Application](#running-the-application)
8. [Key Features Deep Dive](#key-features-deep-dive)
9. [Amendment Workflow](#amendment-workflow)
10. [File Naming Convention](#file-naming-convention)

---

## 🛠 Tech Stack

### Frontend

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts (line, pie charts for analytics)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **HTTP Client**: Fetch API

### Backend

- **Runtime**: Node.js with TypeScript (tsx)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: bcrypt for password hashing
- **File Upload**: Multer (10MB PDF limit)
- **CORS**: Enabled for cross-origin requests

### Database

- **Type**: PostgreSQL
- **Migrations**: Drizzle Kit with auto-migrations

---

## 📁 Project Structure

```
intima_hub/
├── src/
│   ├── components/
│   │   ├── Header.tsx           # Top navigation with user info and logout
│   │   └── Sidebar.tsx          # Side navigation for different views
│   ├── pages/
│   │   ├── Login.tsx            # Authentication page
│   │   ├── Dashboard.tsx        # INTIMA admin submission overview
│   │   ├── Submission.tsx       # Student form for creating submissions
│   │   ├── SubmissionDetail.tsx # Detailed view with review interface
│   │   ├── Tracker.tsx          # Student submission status tracker
│   │   └── Feedback.tsx         # Feedback/comments display
│   ├── db/
│   │   ├── schema.ts            # Database table definitions
│   │   ├── index.ts             # Database connection
│   │   ├── migrate.ts           # Migration runner
│   │   ├── seed.ts              # Initial data seeding
│   │   └── clear.ts             # Database clearing utility
│   ├── types.ts                 # TypeScript interfaces
│   ├── config.ts                # API configuration
│   ├── App.tsx                  # Main app container with routing
│   ├── index.tsx                # React entry point
│   └── index.css                # Global styles
├── server.ts                    # Express API server
├── drizzle/                     # Migration files
├── uploads/                     # Uploaded PDF files (created at runtime)
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite build configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── .env                         # Environment variables
```

---

## 🗄 Database Schema

### Core Tables

#### 1. **users**

Stores user account information with role-based access.

```typescript
- id: UUID (Primary Key)
- name: String
- email: String (Unique)
- password: String (bcrypt hashed)
- role: 'student' | 'intima'
- affiliates: String[] (Array of affiliate IDs for students)
- permissions: String[] (Access control)
```

#### 2. **affiliates**

Represents student organizations/clubs/affiliates.

```typescript
- id: UUID (Primary Key)
- name: String
- description: Text (Optional)
- category: 'Sports' | 'Academic' | 'Special Interest' | 'Service'
- status: 'Active' | 'Inactive' | 'Pending Approval'
- memberCount: Integer
- advisorId: String (Foreign Key to users)
- committeeMembers: String[] (Array of member IDs)
```

#### 3. **sap** (Student Activity Proposal)

Stores SAP submissions.

```typescript
- id: UUID (Primary Key)
- affiliateId: UUID (Foreign Key)
- activityName: String
- date: Timestamp (Activity date)
- description: Text (Optional)
- status: ActivityStatus (See status workflow below)
- submittedBy: String (Student ID)
- comments: JSON (Array of feedback entries)
- files: JSON (Array of uploaded PDF URLs)
- submittedAt: Timestamp
- createdAt: Timestamp
- updatedAt: Timestamp

// Department Review Fields
- financeReviewStatus: 'Pending' | 'Approved' | 'Rejected' | 'Not Required'
- financeComments: JSON (Array of comments)
- financeReviewedBy: String (Reviewer ID)
- financeReviewedAt: Timestamp

- activitiesReviewStatus: 'Pending' | 'Approved' | 'Rejected' | 'Not Required'
- activitiesComments: JSON (Array of comments)
- activitiesReviewedBy: String (Reviewer ID)
- activitiesReviewedAt: Timestamp
```

#### 4. **asf** (Activity Summary Form)

Identical structure to SAP table but for summary submissions.

#### 5. **submissions**

Metadata table tracking all submissions across SAP and ASF.

```typescript
- id: UUID (Primary Key)
- submittedBy: String (Student ID)
- formType: 'SAP' | 'ASF'
- formId: UUID (Reference to SAP or ASF record)
- submittedAt: Timestamp
```

#### 6. **activity_logs**

Audit trail for all significant actions.

```typescript
- id: UUID (Primary Key)
- userId: String
- action: String (Description of action)
- timestamp: Timestamp
- relatedFormId: UUID (Optional)
- formType: 'sap' | 'asf' (Optional)
- oldStatus: String (Previous status)
- newStatus: String (New status)
```

### Status Workflow

```
Pending Validation
    ↓
Awaiting INTIMA Review (Auto-triggered when Finance OR Activities department reviews)
    ↓
├── Approved (Both departments approve)
├── Rejected (Either department rejects)
└── Requires Amendment (Needs revision)
```

---

## 🔌 API Endpoints

### Authentication

- **POST** `/login`
  - Body: `{ email, password }`
  - Returns: `{ user: { id, name, email, role } }`

### File Management

- **POST** `/api/upload`

  - Multipart form data with PDF file
  - Returns: `{ filename, path, url, size }`
  - Constraints: 10MB max, PDF only

- **POST** `/api/check-file`
  - Body: `{ filePath }`
  - Returns: `{ exists: boolean }`

### Submissions

- **GET** `/api/submissions`

  - Returns all SAP and ASF submissions with department reviews
  - Includes: id, type, affiliateId, affiliateName, status, documents, etc.

- **GET** `/api/submission/:id`

  - Returns detailed submission with all fields
  - Includes: status, comments, documents, department reviews

- **GET** `/api/submissions/user/:userId`

  - Returns submissions for a specific user's affiliates

- **POST** `/api/submissions/sap`

  - Create new SAP submission
  - Body: `{ affiliateId, activityName, date, description, files[] }`

- **POST** `/api/submissions/asf`

  - Create new ASF submission
  - Body: Same as SAP

- **POST** `/api/submission/:id/comment`

  - Add comment to submission feedback
  - Body: `{ formType, text, userId, userName }`

- **DELETE** `/api/submission/:id/comment`

  - Delete comment by index
  - Body: `{ formType, commentIndex, userId }`

- **PATCH** `/api/submission/:id/status`
  - Submit amendment for "Requires Amendment" status
  - Body: `{ formType, status, userId, newDocument, amendmentComment }`
  - Features:
    - Uploads amended PDF document
    - Stores amendment comment with [AMENDMENT] prefix
    - Auto-transitions status to "Awaiting INTIMA Review"
    - Saves all changes to database

### Department Reviews

- **PUT** `/api/submissions/:id/department-review`
  - Submit department review for Finance or Activities
  - Body: `{
  formType,
  financeReviewStatus,
  financeReviewMessage,
  activitiesReviewStatus,
  activitiesReviewMessage,
  userId
}`
  - Features:
    - Auto-triggers status to "Awaiting INTIMA Review" when submitted
    - Formats comments as "Status: X, Reason: Y"
    - Refreshes UI immediately

### Affiliates

- **GET** `/api/user/:userId/affiliates`
  - Returns affiliates where user has access

---

## 👥 User Roles & Workflows

### Student Role

**Capabilities:**

- Create new SAP submissions
- Create new ASF submissions
- Upload PDF documents (up to 10MB each, multiple files)
- View their own submission status in Tracker
- View feedback and comments on their submissions
- Track submission progress through review stages

**Workflow:**

1. Login → Navigate to Submission
2. Select submission type (SAP or ASF)
3. Fill form: Activity name, date, affiliate, description
4. Upload one or more PDF documents
5. Submit form
6. View status in Tracker
7. Receive feedback if "Requires Amendment"

### INTIMA Admin Role

**Capabilities:**

- View all submissions in Dashboard
- Search and filter submissions by status
- View detailed submission information
- Manage departmental reviews (Finance & Activities)
- Update submission status (Approved, Rejected, Requires Amendment)
- Upload digitally signed approval/rejection forms
- View analytics (charts showing submission statistics)

**Workflow:**

1. Login → Dashboard loads with all submissions
2. Click on submission to view details
3. Perform Finance or Activities review (optional)
   - Select review status
   - Add comments
4. Update main status to Approved/Rejected
   - Add feedback message
   - Upload digitally signed form
5. UI auto-refreshes with all updates
6. Dashboard analytics update in real-time

---

## 💻 Installation & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Step 1: Clone & Install Dependencies

```bash
cd intima_hub
npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/intima_hub
API_URL=http://localhost:3001
```

### Step 3: Database Setup

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed initial data
npm run db:seed

# (Optional) Clear database
npm run db:clear
```

### Step 4: Install Dependencies

```bash
npm install
```

---

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Frontend (Vite Dev Server)**

```bash
npm run dev
```

Runs on: `http://localhost:5173`

**Terminal 2 - Backend (Express Server)**

```bash
npm run server
```

Runs on: `http://localhost:3001`

### Production Build

```bash
npm run build
# Output in dist/ folder
```

### TypeScript Linting

```bash
npm run lint
```

---

## 🎨 Key Features Deep Dive

### 1. Dual Submission Types

- **SAP (Student Activity Proposal)**: Advance planning and approval for activities
- **ASF (Activity Summary Form)**: Post-activity summary and reporting
- Identical functionality but used at different stages of activity lifecycle

### 2. Multi-File Document Support

- Students can upload multiple PDF documents per submission
- Files stored in `uploads/` directory with unique filenames
- Database stores relative paths for consistency
- Digitally signed forms automatically appended to files list when status updated

### 3. Department Review System

**Finance Department:**

- Reviews financial aspects (budget, spending)
- Can mark: Pending, Approved, Rejected, Not Required
- Adds comments explaining review

**Activities Department:**

- Reviews activity compliance and requirements
- Can mark: Pending, Approved, Rejected, Not Required
- Adds comments explaining review

**Auto-Trigger:**

- When either department submits a review → Status auto-changes to "Awaiting INTIMA Review"
- Main admin then reviews department feedback and makes final decision

### 4. Smart UI Refresh

- After status update: UI automatically fetches latest submission details
- After department review: All fields update in real-time
- No manual page refresh needed
- Department review cards show:
  - Review status (Pending, Approved, Rejected, Not Required)
  - Reviewer name and user ID
  - Review date
  - Comments with proper formatting

### 5. Dashboard Analytics

- Line chart showing submission trends over time
- Pie chart showing status distribution
- Real-time statistics cards:
  - Total submissions
  - Pending submissions
  - Approved submissions
- Search functionality across all submissions
- Filter by status

### 6. PDF Viewer Integration

- Embedded PDF viewer in submission detail page
- Multiple document support with tab navigation
- Fallback download link if viewer fails
- File existence validation

### 7. Digitally Signed Forms

- Required for Approved/Rejected status changes
- Automatically added to submission's files array
- Stored with relative path format for consistency
- Available for download in documents section

### 8. Amendment Workflow

- When status is "Requires Amendment", a dedicated amendment section appears
- Features:
  - **Drag-and-Drop Interface**: Same professional styling as submission form
  - **PDF-Only Uploads**: Ensures document consistency
  - **Amendment Comments**: Required field to describe changes
  - **Auto-Status Update**: Automatically transitions to "Awaiting INTIMA Review"
  - **System Messages**: Amendment comments prefixed with [AMENDMENT] tag
  - **Protected Comments**: System messages cannot be deleted by users
- Amendment documents named as: `amended_v1.pdf`, `amended_v2.pdf`, etc.
- All amendments tracked in submission history with timestamps

### 9. Enhanced Comment System

- **Newest First Display**: Comments sorted with newest at top
- **System Message Protection**: Users cannot delete system-generated messages
- **Comment Tracking**: Each comment includes author, timestamp, and content
- **Amendment History**: Full trace of all amendments and feedback in comments

---

## 🔐 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **CORS**: Configured to allow cross-origin requests
- **File Validation**: PDF-only uploads with 10MB file size limit
- **Input Validation**: Frontend and backend validation
- **Type Safety**: Full TypeScript implementation
- **Role-Based Access**: Separate interfaces for students and admins

---

## 📊 Database Relationships

```
users (1) ──→ (M) affiliates
users (1) ──→ (M) sap (submittedBy)
users (1) ──→ (M) asf (submittedBy)
affiliates (1) ──→ (M) sap
affiliates (1) ──→ (M) asf
sap/asf (1) ──→ (1) submissions
submissions (1) ──→ (M) activity_logs
```

---

## 🎯 Workflow Summary

### Student Submission Flow

```
Login (Student)
    ↓
Dashboard/Tracker View
    ↓
Create New Submission (SAP or ASF)
    ↓
Fill Form Details
    ↓
Upload PDF Documents
    ↓
Submit Form
    ↓
Track Status in Tracker Page
```

### Admin Review Flow

```
Login (INTIMA Admin)
    ↓
Dashboard View (All Submissions)
    ↓
Click on Submission
    ↓
View Submission Details
    ↓
(Optional) Submit Department Review
    (Finance or Activities)
    ↓
Update Main Status
    ├── Approved (+ signed form)
    ├── Rejected (+ signed form)
    └── Requires Amendment
    ↓
UI Auto-Refreshes with All Updates
```

---

## 📝 Comments Format

Department review comments are formatted as:

```
Status: [Review Status], Reason: [Your comment]
```

Example:

```
Status: Approved, Reason: Budget allocation is appropriate and within guidelines.
```

---

## 🐛 Error Handling

- **File Upload Errors**: User-friendly messages for failed uploads
- **Network Errors**: Graceful error messages and retry options
- **Validation Errors**: Clear field-by-field validation feedback
- **API Errors**: Comprehensive error messages from backend
- **File Not Found**: Displays user-friendly message if PDF is missing

---

## 🔄 Auto-Refresh Mechanism

The `refreshSubmissionDetails()` function automatically updates:

- Submission status
- All comments and feedback
- Documents/files list (including newly uploaded signed forms)
- Department review statuses and timestamps
- Reviewer information
- All timestamps (submittedAt, reviewedAt, etc.)

This ensures the UI always displays the most current data without requiring manual page reload.

---

## 📱 Responsive Design

- Mobile-first approach with Tailwind CSS
- Responsive grid layouts
- Mobile menu in header
- Touch-friendly UI elements
- Adapts to all screen sizes

---

## 🚀 Future Enhancement Ideas

- Email notifications for status updates
- Bulk submission import/export
- Advanced filtering and reporting
- Submission templates
- Scheduled submissions
- Submission versioning
- Custom workflows
- Integration with calendar systems

---

## � Amendment Workflow

When a submission receives "Requires Amendment" status:

### Student Side:

```
View Submission Details
    ↓
See "Requires Amendment" status
    ↓
Amendment Section Appears with:
    - Drag-and-drop file upload
    - Amendment notes textarea
    - Submit button
    ↓
Upload amended PDF
    ↓
Add description of changes
    ↓
Click "Submit Amendment & Move to Review"
    ↓
File uploaded as amended_v1.pdf
Comment saved with [AMENDMENT] prefix
Status auto-changed to "Awaiting INTIMA Review"
    ↓
Wait for next review round
```

### Admin Side:

```
Review Dashboard
    ↓
Click on submission with "Requires Amendment"
    ↓
Send amendment request with comments
    ↓
Student submits amended version
    ↓
View updated documents list with amended_v1.pdf
    ↓
See [AMENDMENT] comment in history
    ↓
Status now "Awaiting INTIMA Review"
    ↓
Review amended document and make final decision
```

### Key Points:

- **Amendment Counter**: Each amendment increments (v1, v2, v3, etc.)
- **Version Tracking**: All versions kept for audit trail
- **Immutable History**: Amendment comments marked as [AMENDMENT] and cannot be deleted
- **Single Document**: Only one amendment file per submission (previous overwritten)
- **One-Click Transition**: Automatically moves to "Awaiting INTIMA Review" status

---

## 📁 File Naming Convention

### Regular Submission Files

Format: `{TYPE}_{ActivityName}_{UUID}.pdf`

Examples:

- `SAP_Fall_Carnival_550e8400-e29b-41d4-a716-446655440000.pdf`
- `ASF_Community_Service_3fa85f64-5717-4562-b3fc-2c963f66afa6.pdf`

**Components:**

- `{TYPE}`: SAP or ASF (submission form type)
- `{ActivityName}`: Activity name with underscores for spaces
- `{UUID}`: Unique identifier to prevent collisions

### Amendment Files

Format: `amended_v{N}.pdf`

Examples:

- `amended_v1.pdf` (first amendment)
- `amended_v2.pdf` (second amendment)
- `amended_v3.pdf` (third amendment)

**Features:**

- Simple versioning for easy identification
- Doesn't include timestamp (cleaner naming)
- Uses UUID internally for uniqueness
- Easy to track amendment history at a glance

### File Storage

- **Location**: `/uploads/` directory
- **Paths Stored**: Database stores relative paths (e.g., `/uploads/amended_v1.pdf`)
- **Conflict Resolution**: Auto-increments version if file exists
- **Cleanup**: Old files kept for audit trail, not deleted on amendment

---

## 🌍 Timezone Handling

All timestamps throughout the application use **UTC+8** (Singapore/Malaysia timezone):

- **Function**: `getUTC8Date()` for database timestamps
- **Function**: `getUTC8Timestamp()` for ISO string timestamps
- **Consistency**: Applied to all timestamp operations:
  - Submission creation
  - Status updates
  - Comments and feedback
  - Department reviews
  - Amendment submissions
- **Display**: Formatted for user readability (e.g., "Oct 20, 2025, 02:30 PM")

---

## 📱 UI/UX Improvements

### SubmissionView Page

- **Full-Width PDF Viewer**: 50vh height for better readability
- **Dropdown Document Selection**: Clean interface for multiple documents
- **Organized Layout**: Stacked sections for better mobile responsiveness
- **Drag-and-Drop Amendments**: Professional file upload experience
- **Comment Sorting**: Newest comments displayed first
- **Protected System Messages**: [AMENDMENT] tags cannot be deleted

### Tracker Page

- **Compact Submission List**: Removed download buttons for cleaner UI
- **Sorting**: Submissions ordered by recently updated
- **Quick Navigation**: Direct link to submission detail page

### SubmissionDetail Page

- **Dropdown Document Selection**: Replaced button tabs with cleaner dropdown
- **Consistent Styling**: Matches SubmissionView layout
- **Reversed Comment Order**: Newest comments first
- **Better Organization**: Clearer section hierarchy

---

---

## 👨‍💻 Developer Notes

- All timestamps stored in UTC
- File paths stored as relative paths (`/uploads/filename.pdf`)
- UUIDs used for all primary keys
- JSON columns used for flexible array storage
- Drizzle ORM handles migrations automatically
- TypeScript strict mode enabled
- All components use React Hooks

---

## 🤝 Contributing

When adding new features:

1. Update database schema in `src/db/schema.ts`
2. Create new migrations automatically with Drizzle
3. Add TypeScript types in `src/types.ts`
4. Add API endpoints in `server.ts`
5. Create/update React components
6. Test with both student and admin roles
7. Ensure UI auto-refreshes with `refreshSubmissionDetails()`

---

**Last Updated**: October 19, 2025
**Version**: 2.0 - Amendment Workflow & UI/UX Enhancements
