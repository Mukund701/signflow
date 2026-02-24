import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middlewares/authMiddleware';
import nodemailer from 'nodemailer'; 
import jwt from 'jsonwebtoken'; 
import { io } from '../server'; 

// =========================================================================
// INTERNAL HELPER: The Secret Detective
// =========================================================================
const logAuditEvent = async (req: Request | AuthRequest, documentId: string, eventType: string) => {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = ((Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) as string) || req.socket?.remoteAddress || req.ip || 'Unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown';

    // THE FIX: We capture the "error" object that Supabase returns
    const { error } = await supabase.from('audit_logs').insert([{
      document_id: documentId,
      event_type: eventType,
      ip_address: ipAddress,
      user_agent: userAgent
    }]);

    // THE FIX: Explicitly log the error so it doesn't fail silently!
    if (error) {
      console.error("🚨 SUPABASE AUDIT LOG INSERT ERROR:", error.message);
    }
  } catch (error) {
    console.error("🚨 AUDIT LOG EXCEPTION:", error);
  }
};

// =========================================================================
// STANDARD ROUTES
// =========================================================================

export const uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const user = req.user; 

    if (!file) {
      res.status(400).json({ error: 'Please upload a file' });
      return;
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data: storageData, error: storageError } = await supabase.storage
      .from('documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true, 
      });

    if (storageError) {
      console.error("❌ SUPABASE UPLOAD ERROR:", storageError);
      res.status(500).json({ error: 'Failed to upload file to storage' });
      return;
    }

    const { data: dbData, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          file_name: file.originalname,
          file_path: filePath,
          owner_id: user?.id,
          status: 'Pending',
        },
      ])
      .select();

    if (dbError) {
      console.error("🚨 DATABASE ERROR:", dbError); 
      res.status(500).json({ error: 'Failed to save document metadata' });
      return;
    }

    await logAuditEvent(req, dbData[0].id, 'Document Uploaded');

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: dbData[0],
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during upload' });
  }
};

export const getUserDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('owner_id', user?.id as string)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch documents' });
      return;
    }

    res.status(200).json({ documents: data });
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching documents' });
  }
};

export const getDocumentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = req.params.id as string; 

    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user?.id as string)
      .single();

    if (error || !doc) {
      res.status(404).json({ error: 'Document not found or unauthorized' });
      return;
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 3600);

    if (urlError || !urlData) {
      if (urlError && urlError.message && urlError.message.includes('Object not found')) {
        await supabase.from('documents').delete().eq('id', id).eq('owner_id', user?.id as string); 
        res.status(404).json({ error: 'File missing from vault. Cleaning up dashboard.' });
        return;
      }
      res.status(500).json({ error: 'Failed to generate document link' });
      return;
    }

    res.status(200).json({ document: doc, viewUrl: urlData.signedUrl });
  } catch (error) {
    console.error("🚨 VIEW DOCUMENT ERROR:", error); 
    res.status(500).json({ error: 'Server error while fetching document' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = req.params.id as string;

    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user?.id as string)
      .single();

    if (fetchError || !doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('owner_id', user?.id as string);

    if (dbError) {
      res.status(500).json({ error: 'Failed to delete from database' });
      return;
    }

    await supabase.storage.from('documents').remove([doc.file_path]);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during deletion' });
  }
};

export const signDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const file = req.file;
    const user = req.user;

    if (!file) {
      res.status(400).json({ error: 'Please upload the signed file' });
      return;
    }

    // THE FIX: Fetch the current old file path before we overwrite it
    const { data: oldDoc } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .single();

    const fileName = `${user?.id}-signed-${Date.now()}.pdf`;
    const filePath = `uploads/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(filePath, file.buffer, { contentType: 'application/pdf', upsert: true });

    if (storageError) throw storageError;

    const { data, error: dbError } = await supabase
      .from('documents')
      .update({ file_path: filePath, status: 'Signed' })
      .eq('id', id)
      .eq('owner_id', user?.id as string)
      .select();

    if (dbError) throw dbError;

    // THE FIX: Clean up the old orphaned file from storage!
    if (oldDoc && oldDoc.file_path) {
      await supabase.storage.from('documents').remove([oldDoc.file_path]);
    }

    await logAuditEvent(req, id, 'Document Signed by Owner');
    io.emit('documentUpdated');

    res.status(200).json({ message: 'Document signed successfully', document: data[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save signed document' });
  }
};

export const requestSignature = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { email } = req.body;
    const user = req.user;

    if (!email) {
      res.status(400).json({ error: 'Recipient email is required' });
      return;
    }

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user?.id as string)
      .single();

    if (docError || !doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const signToken = jwt.sign(
      { documentId: id, email }, 
      (process.env.JWT_SECRET as string) || 'fallback_secret', 
      { expiresIn: '7d' }
    );

    const signLink = `http://localhost:3000/sign/${signToken}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER as string,
        pass: process.env.EMAIL_APP_PASSWORD as string, 
      },
    });

    const mailOptions = {
      from: `"Document Signature App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Signature Requested: ${doc.file_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #333;">Signature Request</h2>
          <p>Hello,</p>
          <p>You have been requested to securely sign the document: <strong>${doc.file_name}</strong>.</p>
          <p>Please click the button below to review and sign the document. This secure link will expire in 7 days.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Review and Sign Document</a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Signature request sent successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send signature request' });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = req.params.id as string;

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', id)
      .eq('owner_id', user?.id as string)
      .single();

    if (docError || !doc) {
      res.status(404).json({ error: 'Document not found or unauthorized' });
      return;
    }

    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('document_id', id)
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// =========================================================================
// PUBLIC ROUTES
// =========================================================================

export const getPublicDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    
    const decoded = jwt.verify(token, (process.env.JWT_SECRET as string) || 'fallback_secret') as unknown as { documentId: string, email: string };

    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', decoded.documentId)
      .single();

    if (error || !doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 3600);

    if (urlError || !urlData) throw urlError;

    if (doc.status.toLowerCase() !== 'signed') {
      await logAuditEvent(req, decoded.documentId, 'Document Opened via Secure Link');
    }

    res.status(200).json({ document: doc, viewUrl: urlData.signedUrl });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired link' });
  }
};

export const signPublicDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'Please upload the signed file' });
      return;
    }

    const decoded = jwt.verify(token, (process.env.JWT_SECRET as string) || 'fallback_secret') as unknown as { documentId: string, email: string };

    // THE FIX: Fetch the current old file path before we overwrite it
    const { data: oldDoc } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', decoded.documentId)
      .single();

    const fileName = `public-signed-${Date.now()}.pdf`;
    const filePath = `uploads/${fileName}`;

    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(filePath, file.buffer, { contentType: 'application/pdf', upsert: true });

    if (storageError) throw storageError;

    const { data, error: dbError } = await supabase
      .from('documents')
      .update({ file_path: filePath, status: 'Signed' })
      .eq('id', decoded.documentId)
      .select();

    if (dbError) throw dbError;

    // THE FIX: Clean up the old orphaned file from storage!
    if (oldDoc && oldDoc.file_path) {
      await supabase.storage.from('documents').remove([oldDoc.file_path]);
    }

    await logAuditEvent(req, decoded.documentId, 'Document Signed by Client');
    io.emit('documentUpdated');

    res.status(200).json({ message: 'Document signed successfully', document: data[0] });
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired link, or failed to sign' });
  }
};