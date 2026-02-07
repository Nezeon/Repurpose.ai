import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../../config/api';

const FileUploadZone = ({ onFileUploaded, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}${ENDPOINTS.FILES_UPLOAD}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / e.total);
            setProgress(pct);
          },
        }
      );

      onFileUploaded(response.data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-brand-border px-6 py-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted">Upload Internal Document (PDF)</span>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/5 text-text-muted"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-brand-yellow bg-brand-yellow/5'
            : uploading
              ? 'border-brand-border bg-brand-darker cursor-wait'
              : 'border-brand-border hover:border-brand-yellow/30 hover:bg-white/[0.02]'
        }`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
            <p className="text-sm text-text-secondary">Processing... {progress}%</p>
            <div className="w-48 h-1.5 bg-brand-darker rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-yellow rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-text-muted" />
            <p className="text-sm text-text-secondary">
              {isDragActive ? 'Drop your PDF here' : 'Drag & drop a PDF, or click to select'}
            </p>
            <p className="text-xs text-text-muted">Max 10MB. The file will be indexed for Q&A.</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </motion.div>
  );
};

export default FileUploadZone;
