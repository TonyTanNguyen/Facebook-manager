import React, { useState, useEffect } from 'react';
import { Building2, Link2, Unlink, RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { businessManagerAPI } from '../services/api';

const BusinessManagerSettings = () => {
  const [businessManager, setBusinessManager] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [token, setToken] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch Business Manager status
  const fetchBusinessManager = async () => {
    try {
      const response = await businessManagerAPI.get();
      if (response.success) {
        setBusinessManager(response.data);
      }
    } catch (err) {
      console.error('Error fetching Business Manager:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessManager();
  }, []);

  // Connect Business Manager
  const handleConnect = async (e) => {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);

    try {
      const response = await businessManagerAPI.connect(token, businessId, businessName);

      if (response.success) {
        setBusinessManager(response.data);
        setShowConnectModal(false);
        setToken('');
        setBusinessId('');
        setBusinessName('');
        setSuccess('Business Manager connected! Sync your pages to see them.');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect Business Manager');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Business Manager
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect the Business Manager?')) {
      return;
    }

    setIsDisconnecting(true);

    try {
      const response = await businessManagerAPI.disconnect();

      if (response.success) {
        setBusinessManager(null);
        setSuccess('Business Manager disconnected');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to disconnect Business Manager');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <XCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}

      {/* Connected State */}
      {businessManager ? (
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">{businessManager.businessName}</h4>
                <p className="text-xs text-slate-400">
                  Connected {new Date(businessManager.connectedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              {isDisconnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Unlink className="w-4 h-4" />
              )}
              Disconnect
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Pages from this Business Manager will be included when you sync pages.
          </p>
        </div>
      ) : (
        /* Not Connected State */
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600 border-dashed">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-600/50 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">No Business Manager Connected</h4>
              <p className="text-xs text-slate-400">
                Connect to access pages from your Business Manager
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConnectModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Connect Business Manager
          </button>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-lg w-full p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Connect Business Manager</h3>

            {/* Instructions */}
            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">How to connect:</h4>
              <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
                <li>
                  Go to{' '}
                  <a
                    href="https://business.facebook.com/settings/business-info"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    Business Info <ExternalLink className="w-3 h-3" />
                  </a>
                  {' '}to find your Business ID
                </li>
                <li>Go to Users → System Users</li>
                <li>Generate a token with pages permissions</li>
              </ol>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm text-slate-300">
                  Business Manager ID *
                </label>
                <input
                  type="text"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="e.g., 123456789012345"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-300">
                  Business Name (optional)
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., My Company"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-300">
                  System User Access Token *
                </label>
                <textarea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your System User token here..."
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm h-20 resize-none focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConnectModal(false);
                    setToken('');
                    setBusinessId('');
                    setBusinessName('');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting || !token.trim() || !businessId.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Connect
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessManagerSettings;
