import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Settings,
  Key,
  Save,
  TestTube,
  Check,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import Button from '../common/Button';
import { API_BASE_URL, ENDPOINTS } from '../../config/api';

const ConfigureModal = ({ integration, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.INTEGRATION_TEST(integration.id)}`,
        { method: 'POST' }
      );
      const result = await response.json();
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Failed to test connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        api_key: apiKey || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-brand-darker border border-brand-dark rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-teal/10 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Configure {integration.name}
              </h2>
              <p className="text-sm text-text-muted">
                {integration.api_key_required
                  ? 'API key required for full functionality'
                  : 'Optional configuration'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-brand-dark rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* API Key Input */}
          {integration.api_key_required && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Key className="w-4 h-4 inline mr-2" />
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    integration.api_key_set
                      ? '••••••••••••••••'
                      : 'Enter your API key'
                  }
                  className="w-full px-4 py-3 bg-brand-dark border border-brand-dark rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-teal pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {integration.api_key_set && (
                <p className="mt-2 text-xs text-brand-teal flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  API key is currently configured
                </p>
              )}
            </div>
          )}

          {/* Rate Limit Info */}
          <div className="bg-brand-dark/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-text-primary mb-2">
              Rate Limit
            </h4>
            <p className="text-sm text-text-muted">
              {integration.rate_limit
                ? `${integration.rate_limit} requests per second`
                : 'No rate limit configured'}
            </p>
          </div>

          {/* Test Connection */}
          <div>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing}
              className="w-full flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  Test Connection
                </>
              )}
            </Button>

            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 p-4 rounded-lg ${
                  testResult.success
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <Check className="w-4 h-4 mt-0.5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 text-red-400" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {testResult.message}
                    </p>
                    {testResult.response_time_ms > 0 && (
                      <p className="text-xs text-text-muted mt-1">
                        Response time: {testResult.response_time_ms}ms
                      </p>
                    )}
                    {/* Show additional details if available */}
                    {testResult.details && Object.keys(testResult.details).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-text-muted mb-1">Connection Details:</p>
                        <div className="space-y-1">
                          {Object.entries(testResult.details).map(([key, value]) => (
                            <div key={key} className="flex items-start text-xs">
                              <span className="text-text-muted min-w-[100px]">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                              </span>
                              <span className={`ml-2 ${testResult.success ? 'text-green-300' : 'text-red-300'}`}>
                                {typeof value === 'object'
                                  ? JSON.stringify(value).slice(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Documentation Link */}
          {integration.docs_url && (
            <a
              href={integration.docs_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-brand-teal hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View Documentation
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-brand-dark">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving || (integration.api_key_required && !apiKey && !integration.api_key_set)}
            className="flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfigureModal;
