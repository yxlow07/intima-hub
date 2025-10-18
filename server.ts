import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './src/db';
import { users, sap, asf, affiliates, submissions } from './src/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const app = express();
const port = 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadsDir));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = `/uploads/${req.file.filename}`;
    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: filePath,
      url: `${req.protocol}://${req.get('host')}${filePath}`,
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

// Get all submissions for dashboard (INTIMA users)
app.get('/api/submissions', async (req, res) => {
  try {
    // Query SAP submissions with safe column selection
    const sapRows = await db
      .select()
      .from(sap)
      .leftJoin(affiliates, eq(sap.affiliateId, affiliates.id));

    const sapSubmissions = sapRows.map(row => ({
      id: row.sap.id,
      type: 'SAP' as const,
      affiliateId: row.sap.affiliateId,
      affiliateName: row.affiliates?.name || 'Unknown',
      activityName: row.sap.activityName,
      date: row.sap.date,
      description: row.sap.description,
      status: row.sap.status,
      documents: (row.sap as any).files || [],
      submittedBy: row.sap.submittedBy,
      submittedAt: row.sap.submittedAt,
      feedback: row.sap.comments,
      financeReviewStatus: (row.sap as any).financeReviewStatus,
      financeComments: (row.sap as any).financeComments,
      financeReviewedBy: (row.sap as any).financeReviewedBy,
      financeReviewedAt: (row.sap as any).financeReviewedAt,
      activitiesReviewStatus: (row.sap as any).activitiesReviewStatus,
      activitiesComments: (row.sap as any).activitiesComments,
      activitiesReviewedBy: (row.sap as any).activitiesReviewedBy,
      activitiesReviewedAt: (row.sap as any).activitiesReviewedAt,
    }));

    // Query ASF submissions with safe column selection
    const asfRows = await db
      .select()
      .from(asf)
      .leftJoin(affiliates, eq(asf.affiliateId, affiliates.id));

    const asfSubmissions = asfRows.map(row => ({
      id: row.asf.id,
      type: 'ASF' as const,
      affiliateId: row.asf.affiliateId,
      affiliateName: row.affiliates?.name || 'Unknown',
      activityName: row.asf.activityName,
      date: row.asf.date,
      description: row.asf.description,
      status: row.asf.status,
      documents: (row.asf as any).files || [],
      submittedBy: row.asf.submittedBy,
      submittedAt: row.asf.submittedAt,
      feedback: row.asf.comments,
      financeReviewStatus: (row.asf as any).financeReviewStatus,
      financeComments: (row.asf as any).financeComments,
      financeReviewedBy: (row.asf as any).financeReviewedBy,
      financeReviewedAt: (row.asf as any).financeReviewedAt,
      activitiesReviewStatus: (row.asf as any).activitiesReviewStatus,
      activitiesComments: (row.asf as any).activitiesComments,
      activitiesReviewedBy: (row.asf as any).activitiesReviewedBy,
      activitiesReviewedAt: (row.asf as any).activitiesReviewedAt,
    }));

    const allSubmissions = [...sapSubmissions, ...asfSubmissions];

    // Sort by submitted date (newest first)
    allSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    res.json(allSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/submissions/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const userRow = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    if (!userRow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const affiliateIds = userRow.affiliates as string[];

    if (!affiliateIds || affiliateIds.length === 0) {
      return res.json([]);
    }

    const sapRows = await db
      .select()
      .from(sap)
      .leftJoin(affiliates, eq(sap.affiliateId, affiliates.id))
      .where(inArray(sap.affiliateId, affiliateIds));

    const sapSubmissions = sapRows.map(row => ({
      id: row.sap.id,
      type: 'SAP' as const,
      affiliateId: row.sap.affiliateId,
      affiliateName: row.affiliates?.name || 'Unknown',
      activityName: row.sap.activityName,
      date: row.sap.date,
      description: row.sap.description,
      status: row.sap.status,
      documents: (row.sap as any).files || [],
      submittedBy: row.sap.submittedBy,
      submittedAt: row.sap.submittedAt,
      feedback: row.sap.comments,
      financeReviewStatus: (row.sap as any).financeReviewStatus,
      financeComments: (row.sap as any).financeComments,
      financeReviewedBy: (row.sap as any).financeReviewedBy,
      financeReviewedAt: (row.sap as any).financeReviewedAt,
      activitiesReviewStatus: (row.sap as any).activitiesReviewStatus,
      activitiesComments: (row.sap as any).activitiesComments,
      activitiesReviewedBy: (row.sap as any).activitiesReviewedBy,
      activitiesReviewedAt: (row.sap as any).activitiesReviewedAt,
    }));

    const asfRows = await db
      .select()
      .from(asf)
      .leftJoin(affiliates, eq(asf.affiliateId, affiliates.id))
      .where(inArray(asf.affiliateId, affiliateIds));

    const asfSubmissions = asfRows.map(row => ({
      id: row.asf.id,
      type: 'ASF' as const,
      affiliateId: row.asf.affiliateId,
      affiliateName: row.affiliates?.name || 'Unknown',
      activityName: row.asf.activityName,
      date: row.asf.date,
      description: row.asf.description,
      status: row.asf.status,
      documents: (row.asf as any).files || [],
      submittedBy: row.asf.submittedBy,
      submittedAt: row.asf.submittedAt,
      feedback: row.asf.comments,
      financeReviewStatus: (row.asf as any).financeReviewStatus,
      financeComments: (row.asf as any).financeComments,
      financeReviewedBy: (row.asf as any).financeReviewedBy,
      financeReviewedAt: (row.asf as any).financeReviewedAt,
      activitiesReviewStatus: (row.asf as any).activitiesReviewStatus,
      activitiesComments: (row.asf as any).activitiesComments,
      activitiesReviewedBy: (row.asf as any).activitiesReviewedBy,
      activitiesReviewedAt: (row.asf as any).activitiesReviewedAt,
    }));

    const allSubmissions = [...sapSubmissions, ...asfSubmissions];

    res.json(allSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single submission (SAP or ASF) by id
app.get('/api/submission/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Try SAP first
    // Try SAP first
    const sapRows = await db
      .select()
      .from(sap)
      .leftJoin(affiliates, eq(sap.affiliateId, affiliates.id))
      .where(eq(sap.id, id))
      .limit(1);

    if (sapRows.length > 0) {
      const row = sapRows[0];
      const result = {
        id: row.sap.id,
        type: 'SAP',
        affiliateId: row.sap.affiliateId,
        affiliateName: row.affiliates?.name || 'Unknown',
        activityName: row.sap.activityName,
        date: row.sap.date,
        description: row.sap.description,
        status: row.sap.status,
        documents: (row.sap as any).files || [],
        submittedBy: row.sap.submittedBy,
        submittedAt: row.sap.submittedAt,
        feedback: row.sap.comments,
        financeReviewStatus: (row.sap as any).financeReviewStatus,
        financeComments: (row.sap as any).financeComments,
        financeReviewedBy: (row.sap as any).financeReviewedBy,
        financeReviewedAt: (row.sap as any).financeReviewedAt,
        activitiesReviewStatus: (row.sap as any).activitiesReviewStatus,
        activitiesComments: (row.sap as any).activitiesComments,
        activitiesReviewedBy: (row.sap as any).activitiesReviewedBy,
        activitiesReviewedAt: (row.sap as any).activitiesReviewedAt,
      };
      return res.json(result);
    }

    // Try ASF
    const asfRows = await db
      .select()
      .from(asf)
      .leftJoin(affiliates, eq(asf.affiliateId, affiliates.id))
      .where(eq(asf.id, id))
      .limit(1);

    if (asfRows.length > 0) {
      const row = asfRows[0];
      const result = {
        id: row.asf.id,
        type: 'ASF',
        affiliateId: row.asf.affiliateId,
        affiliateName: row.affiliates?.name || 'Unknown',
        activityName: row.asf.activityName,
        date: row.asf.date,
        description: row.asf.description,
        status: row.asf.status,
        documents: (row.asf as any).files || [],
        submittedBy: row.asf.submittedBy,
        submittedAt: row.asf.submittedAt,
        feedback: row.asf.comments,
        financeReviewStatus: (row.asf as any).financeReviewStatus,
        financeComments: (row.asf as any).financeComments,
        financeReviewedBy: (row.asf as any).financeReviewedBy,
        financeReviewedAt: (row.asf as any).financeReviewedAt,
        activitiesReviewStatus: (row.asf as any).activitiesReviewStatus,
        activitiesComments: (row.asf as any).activitiesComments,
        activitiesReviewedBy: (row.asf as any).activitiesReviewedBy,
        activitiesReviewedAt: (row.asf as any).activitiesReviewedAt,
      };
      return res.json(result);
    }

    res.status(404).json({ message: 'Submission not found' });
  } catch (error) {
    console.error('Error fetching submission detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's affiliates
app.get('/api/user/:userId/affiliates', async (req, res) => {
  const { userId } = req.params;

  try {
    const userRow = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    if (!userRow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const affiliateIds = userRow.affiliates as string[];

    if (!affiliateIds || affiliateIds.length === 0) {
      return res.json([]);
    }

    const userAffiliates = await db
      .select({
        id: affiliates.id,
        name: affiliates.name,
        description: affiliates.description,
        category: affiliates.category,
        status: affiliates.status,
        memberCount: affiliates.memberCount,
        advisorId: affiliates.advisorId,
        committeeMembers: affiliates.committeeMembers,
        createdAt: affiliates.createdAt,
        updatedAt: affiliates.updatedAt,
      })
      .from(affiliates)
      .where(inArray(affiliates.id, affiliateIds));

    res.json(userAffiliates);
  } catch (error) {
    console.error('Error fetching user affiliates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create SAP submission
app.post('/api/submission/sap', async (req, res) => {
  const { affiliateId, activityName, date, description, files, submittedBy } = req.body;

  try {
    if (!affiliateId || !activityName || !date || !submittedBy) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newSap = await db.insert(sap).values({
      affiliateId,
      activityName,
      date: new Date(date),
      description: description || null,
      status: 'Pending Validation',
      submittedBy,
      files: files || null,
      comments: null,
    }).returning();

    res.status(201).json(newSap[0]);
  } catch (error) {
    console.error('Error creating SAP submission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create ASF submission
app.post('/api/submission/asf', async (req, res) => {
  const { affiliateId, activityName, date, description, files, submittedBy } = req.body;

  try {
    if (!affiliateId || !activityName || !date || !submittedBy) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newAsf = await db.insert(asf).values({
      affiliateId,
      activityName,
      date: new Date(date),
      description: description || null,
      status: 'Pending Validation',
      submittedBy,
      files: files || null,
      comments: null,
    }).returning();

    res.status(201).json(newAsf[0]);
  } catch (error) {
    console.error('Error creating ASF submission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add comment to SAP or ASF submission
app.post('/api/submission/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { formType, text, userId, userName } = req.body;

  if (!text || !formType || !userId || !userName) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newComment = {
      id: Math.random().toString(36).substring(7),
      author: userName,
      authorId: userId,
      text: text,
      timestamp: new Date().toISOString(),
    };

    const table = formType === 'SAP' ? sap : asf;

    // Get existing comments
    const existingRow = await db.select({ comments: table.comments }).from(table).where(eq(table.id, id)).limit(1).then(rows => rows[0]);
    
    let updatedComments = [newComment];
    if (existingRow?.comments) {
      const parsedComments = typeof existingRow.comments === 'string' 
        ? JSON.parse(existingRow.comments) 
        : Array.isArray(existingRow.comments) ? existingRow.comments : [];
      updatedComments = [...parsedComments, newComment];
    }

    // Update the table with new comments
    await db.update(table).set({ comments: updatedComments }).where(eq(table.id, id));

    res.status(200).json({ message: 'Comment added successfully', comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete comment from SAP or ASF submission
app.delete('/api/submission/:id/comment', async (req, res) => {
  const { id } = req.params;
  const { formType, commentIndex, userId } = req.body;

  if (!formType || commentIndex === undefined || !userId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const table = formType === 'SAP' ? sap : asf;

    // Get existing comments
    const existingRow = await db.select({ comments: table.comments }).from(table).where(eq(table.id, id)).limit(1).then(rows => rows[0]);
    
    if (!existingRow?.comments) {
      return res.status(404).json({ message: 'No comments found' });
    }

    const comments = typeof existingRow.comments === 'string' 
      ? JSON.parse(existingRow.comments) 
      : Array.isArray(existingRow.comments) ? existingRow.comments : [];

    // Check if comment exists and user is the author
    if (commentIndex < 0 || commentIndex >= comments.length) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comments[commentIndex].authorId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    // Remove the comment
    const updatedComments = comments.filter((_: any, i: number) => i !== commentIndex);

    // Update the table with updated comments
    await db.update(table).set({ comments: updatedComments }).where(eq(table.id, id));

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Test endpoint to verify the server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Check if file exists endpoint
app.post('/api/check-file', (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ exists: false, message: 'No file path provided' });
  }

  try {
    // Extract the file path from the URL (e.g., "/uploads/filename.pdf" -> "uploads/filename.pdf")
    let normalizedPath = filePath;
    
    // Remove leading slash if present
    if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.substring(1);
    }

    // Get full file system path
    const fullPath = path.join(__dirname, normalizedPath);

    console.log('Checking file existence:');
    console.log('  Input:', filePath);
    console.log('  Normalized:', normalizedPath);
    console.log('  Full path:', fullPath);

    // Check if file exists using fs
    const exists = fs.existsSync(fullPath);

    console.log('  Exists:', exists);

    res.json({ 
      exists: exists,
      filePath: filePath,
      fullPath: fullPath,
      message: exists ? 'File exists' : 'File not found'
    });
  } catch (error) {
    console.error('Error checking file:', error);
    res.status(500).json({ 
      exists: false, 
      message: 'Error checking file',
      error: (error as any).message
    });
  }
});

// Update submission status endpoint
app.put('/api/submissions/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, message, signedFormUrl } = req.body;

  console.log('Status update request:', { id, status, message, signedFormUrl });

  if (!status || !message) {
    return res.status(400).json({ message: 'Status and message are required' });
  }

  // Require signed form for Approved or Rejected status
  if ((status === 'Approved' || status === 'Rejected') && !signedFormUrl) {
    return res.status(400).json({ message: 'Signed form is required for Approved or Rejected status' });
  }

  const validStatuses = ['Pending Validation', 'Awaiting INTIMA Review', 'Requires Amendment', 'Approved', 'Rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    // Check if it's a SAP submission
    let submission = await db
      .select()
      .from(sap)
      .where(eq(sap.id, id as any))
      .limit(1)
      .then(rows => rows[0]);

    let isSap = !!submission;
    const table = isSap ? sap : asf;

    console.log('Found in SAP:', isSap, 'Submission ID:', id);

    // If not SAP, check ASF
    if (!submission) {
      submission = await db
        .select()
        .from(asf)
        .where(eq(asf.id, id as any))
        .limit(1)
        .then(rows => rows[0]);
      
      console.log('Found in ASF:', !!submission);
    }

    if (!submission) {
      console.log('Submission not found for ID:', id);
      return res.status(404).json({ message: 'Submission not found', submissionId: id });
    }

    // Parse existing comments
    let comments: any[] = [];
    if (submission.comments) {
      try {
        comments = Array.isArray(submission.comments) 
          ? submission.comments 
          : typeof submission.comments === 'string'
            ? JSON.parse(submission.comments)
            : submission.comments;
      } catch (e) {
        console.error('Error parsing comments:', e);
        comments = [];
      }
    }

    // Parse existing files array
    let files: string[] = [];
    if ((submission as any).files) {
      try {
        files = Array.isArray((submission as any).files) 
          ? (submission as any).files 
          : typeof (submission as any).files === 'string'
            ? JSON.parse((submission as any).files)
            : (submission as any).files;
      } catch (e) {
        console.error('Error parsing files:', e);
        files = [];
      }
    }

    // Add signed form to files array if provided
    if (signedFormUrl) {
      files.push(signedFormUrl);
    }

    // Add new comment with signed form reference
    const newComment = {
      author: 'INTIMA Review',
      timestamp: new Date().toISOString(),
      text: `Status updated to "${status}": ${message}`,
      authorId: 'system',
      signedFormUrl: signedFormUrl || null,
    };

    comments.push(newComment);

    // Update the submission with new status and comments
    const result = await db
      .update(table)
      .set({
        status: status as any,
        comments: comments as any,
        files: files as any,
        updatedAt: new Date(),
      })
      .where(eq(table.id, id as any))
      .returning();

    console.log('Update result:', result);

    res.json({ 
      message: 'Status updated successfully',
      updatedStatus: status,
      updatedComments: comments,
      updatedFiles: files,
      signedFormUrl: signedFormUrl,
      submission: result[0] || null,
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Internal server error', error: (error as any).message });
  }
});

// Update department reviews (Finance/Activities) for SAP or ASF submission
app.put('/api/submissions/:id/department-review', async (req, res) => {
  const { id } = req.params;
  const { formType, financeReviewStatus, financeReviewMessage, activitiesReviewStatus, activitiesReviewMessage, userId } = req.body;

  if (!formType) {
    return res.status(400).json({ message: 'Form type is required' });
  }

  try {
    const table = formType === 'SAP' ? sap : asf;

    // Get existing submission
    const submission = await db
      .select()
      .from(table)
      .where(eq(table.id, id as any))
      .limit(1)
      .then(rows => rows[0]);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Parse existing comments
    let comments = Array.isArray(submission.comments) ? submission.comments : [];

    // Update Finance Review if provided
    let updateData: any = {};
    if (financeReviewStatus) {
      updateData.financeReviewStatus = financeReviewStatus;
      updateData.financeReviewedBy = userId || 'Unknown';
      updateData.financeReviewedAt = new Date();
      
      // Add finance review to comments
      const financeComment = {
        id: Math.random().toString(36).substring(7),
        author: 'Finance Department',
        authorId: userId || 'system',
        text: `Status: ${financeReviewStatus}, Reason: ${financeReviewMessage || 'No reason provided'}`,
        timestamp: new Date().toISOString(),
        department: 'Finance',
      };
      comments.push(financeComment);

      // Parse existing finance comments array
      let financeComments = Array.isArray(submission.financeComments) ? submission.financeComments : [];
      if (financeReviewMessage) {
        financeComments.push({
          id: Math.random().toString(36).substring(7),
          text: financeReviewMessage,
          timestamp: new Date().toISOString(),
        });
      }
      updateData.financeComments = financeComments;
    }

    // Update Activities Review if provided
    if (activitiesReviewStatus) {
      updateData.activitiesReviewStatus = activitiesReviewStatus;
      updateData.activitiesReviewedBy = userId || 'Unknown';
      updateData.activitiesReviewedAt = new Date();
      
      // Add activities review to comments
      const activitiesComment = {
        id: Math.random().toString(36).substring(7),
        author: 'Activities Department',
        authorId: userId || 'system',
        text: `Status: ${activitiesReviewStatus}, Reason: ${activitiesReviewMessage || 'No reason provided'}`,
        timestamp: new Date().toISOString(),
        department: 'Activities',
      };
      comments.push(activitiesComment);

      // Parse existing activities comments array
      let activitiesComments = Array.isArray(submission.activitiesComments) ? submission.activitiesComments : [];
      if (activitiesReviewMessage) {
        activitiesComments.push({
          id: Math.random().toString(36).substring(7),
          text: activitiesReviewMessage,
          timestamp: new Date().toISOString(),
        });
      }
      updateData.activitiesComments = activitiesComments;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No review data provided' });
    }

    // Update comments and set status to "Awaiting INTIMA Review"
    updateData.comments = comments;
    updateData.status = 'Awaiting INTIMA Review';
    updateData.updatedAt = new Date();

    // Update the submission
    const result = await db
      .update(table)
      .set(updateData)
      .where(eq(table.id, id as any))
      .returning();

    res.json({ 
      message: 'Department review updated successfully',
      submission: result[0],
    });
  } catch (error) {
    console.error('Error updating department review:', error);
    res.status(500).json({ message: 'Internal server error', error: (error as any).message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
