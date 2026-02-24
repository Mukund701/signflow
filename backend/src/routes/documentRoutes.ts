import express from 'express';
import multer from 'multer';
import { 
  uploadDocument, 
  getUserDocuments, 
  getDocumentById, 
  deleteDocument, 
  signDocument,
  requestSignature,
  getPublicDocument, 
  signPublicDocument,
  getAuditLogs
} from '../controllers/documentController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- PROTECTED ROUTES (Requires Login) ---
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getUserDocuments);       
router.get('/:id', protect, getDocumentById);     
router.delete('/:id', protect, deleteDocument);   
router.put('/:id/sign', protect, upload.single('file'), signDocument);
router.post('/:id/request', protect, requestSignature);

// 🆕 NEW ROUTE: Get Audit Logs
router.get('/:id/logs', protect, getAuditLogs);

// --- PUBLIC ROUTES (Requires Email Token) ---
router.get('/public/:token', getPublicDocument);
router.put('/public/:token/sign', upload.single('file'), signPublicDocument);

export default router;