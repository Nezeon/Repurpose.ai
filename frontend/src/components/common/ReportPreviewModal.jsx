import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Maximize2 } from 'lucide-react';

const ReportPreviewModal = ({ isOpen, onClose, pdfBlob, title = 'Report Preview', onDownload }) => {
  // Create object URL from blob
  const objectUrl = useMemo(() => {
    if (!pdfBlob) return null;
    return URL.createObjectURL(pdfBlob);
  }, [pdfBlob]);

  // Cleanup object URL on unmount or blob change
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    // Default download behavior
    if (!objectUrl) return;
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${title.replace(/[^a-zA-Z0-9-_ ]/g, '')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenInNewTab = () => {
    if (objectUrl) {
      window.open(objectUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && objectUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col m-4 md:m-8 flex-1 bg-brand-darker border border-brand-border rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-border bg-brand-dark/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-yellow/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-yellow" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                  <p className="text-[10px] text-text-muted">
                    {pdfBlob ? `${(pdfBlob.size / 1024).toFixed(0)} KB` : 'Loading...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  New Tab
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-dark bg-brand-yellow hover:bg-brand-yellow/90 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PDF iframe */}
            <div className="flex-1 bg-neutral-800">
              <iframe
                src={objectUrl}
                className="w-full h-full border-0"
                title={title}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportPreviewModal;
