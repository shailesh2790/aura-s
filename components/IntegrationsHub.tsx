import React, { useState, useEffect } from 'react';
import { API_INTEGRATIONS, getIntegrationsByCategory } from '../services/apiIntegrations';
import { credentialManager, createCredential, validateCredential } from '../services/credentialManager';
import { APIIntegration, APICredential } from '../types/advanced';
import { Plug, Check, Plus, Trash2, Eye, EyeOff, AlertCircle, ExternalLink } from 'lucide-react';
import { ShopifySetup } from './ShopifySetup';

export const IntegrationsHub: React.FC = () => {
  const [credentials, setCredentials] = useState<APICredential[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<APIIntegration | null>(null);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = () => {
    setCredentials(credentialManager.getAllCredentials());
  };

  const categories = [
    { id: 'all', label: 'All', count: API_INTEGRATIONS.length },
    { id: 'Payment', label: 'Payment', count: getIntegrationsByCategory('Payment').length },
    { id: 'Communication', label: 'Communication', count: getIntegrationsByCategory('Communication').length },
    { id: 'CRM', label: 'CRM', count: getIntegrationsByCategory('CRM').length },
    { id: 'E-commerce', label: 'E-commerce', count: getIntegrationsByCategory('E-commerce').length },
    { id: 'Productivity', label: 'Productivity', count: getIntegrationsByCategory('Productivity').length },
    { id: 'Database', label: 'Database', count: getIntegrationsByCategory('Database').length },
    { id: 'AI', label: 'AI', count: getIntegrationsByCategory('AI').length }
  ];

  const filteredIntegrations = selectedCategory === 'all'
    ? API_INTEGRATIONS
    : getIntegrationsByCategory(selectedCategory);

  const getIntegrationCredentials = (integrationId: string) => {
    return credentials.filter(c => c.integrationId === integrationId);
  };

  const isConnected = (integrationId: string) => {
    return getIntegrationCredentials(integrationId).length > 0;
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-950 to-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Plug className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Integrations Hub</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Connect your favorite apps and services. {credentials.length} integration{credentials.length !== 1 ? 's' : ''} configured.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Total Integrations</p>
            <p className="text-3xl font-bold text-white">{API_INTEGRATIONS.length}</p>
          </div>
          <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Connected</p>
            <p className="text-3xl font-bold text-green-400">{credentials.length}</p>
          </div>
          <div className="bg-slate-800/50 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Categories</p>
            <p className="text-3xl font-bold text-yellow-400">8</p>
          </div>
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">API Actions</p>
            <p className="text-3xl font-bold text-purple-400">
              {API_INTEGRATIONS.reduce((sum, int) => sum + int.actions.length, 0)}
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg border transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-gray-300 hover:bg-slate-700/50'
              }`}
            >
              {cat.label} <span className="text-xs opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => {
            const connected = isConnected(integration.id);
            const integrationCreds = getIntegrationCredentials(integration.id);

            return (
              <div
                key={integration.id}
                className={`bg-slate-800/50 backdrop-blur-sm border rounded-xl p-6 hover:border-blue-500 transition cursor-pointer ${
                  connected ? 'border-green-500/50' : 'border-blue-500/30'
                }`}
                onClick={() => setSelectedIntegration(integration)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{integration.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{integration.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">{integration.category}</p>
                    </div>
                  </div>
                  {connected && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">Connected</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4">{integration.description}</p>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Actions</span>
                    <span className="text-blue-400 font-semibold">{integration.actions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Triggers</span>
                    <span className="text-blue-400 font-semibold">{integration.triggers.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Auth Type</span>
                    <span className="text-gray-300 font-mono">{integration.authType}</span>
                  </div>
                </div>

                {/* Connected Credentials */}
                {connected && (
                  <div className="mb-4 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-xs text-green-400">
                      {integrationCreds.length} credential{integrationCreds.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIntegration(integration);
                    setShowAddCredential(true);
                  }}
                  className={`w-full px-4 py-2 rounded-lg transition ${
                    connected
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {connected ? 'Manage' : 'Connect'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integration Detail Modal */}
      {selectedIntegration && !showAddCredential && (
        <IntegrationDetailModal
          integration={selectedIntegration}
          credentials={getIntegrationCredentials(selectedIntegration.id)}
          onClose={() => setSelectedIntegration(null)}
          onAddCredential={() => setShowAddCredential(true)}
          onDeleteCredential={(credId) => {
            credentialManager.deleteCredential(credId);
            loadCredentials();
          }}
        />
      )}

      {/* Add Credential Modal */}
      {selectedIntegration && showAddCredential && (
        <AddCredentialModal
          integration={selectedIntegration}
          onClose={() => {
            setShowAddCredential(false);
            setSelectedIntegration(null);
          }}
          onSave={() => {
            loadCredentials();
            setShowAddCredential(false);
          }}
        />
      )}
    </div>
  );
};

// Integration Detail Modal
const IntegrationDetailModal: React.FC<{
  integration: APIIntegration;
  credentials: APICredential[];
  onClose: () => void;
  onAddCredential: () => void;
  onDeleteCredential: (id: string) => void;
}> = ({ integration, credentials, onClose, onAddCredential, onDeleteCredential }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-blue-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{integration.icon}</div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{integration.name}</h2>
              <p className="text-gray-400">{integration.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Documentation Link */}
          {integration.documentation && (
            <a
              href={integration.documentation}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View API Documentation</span>
            </a>
          )}

          {/* Credentials */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">Configured Credentials</h3>
              <button
                onClick={onAddCredential}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add Credential
              </button>
            </div>

            {credentials.length === 0 ? (
              <p className="text-gray-400 text-sm">No credentials configured yet</p>
            ) : (
              <div className="space-y-2">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{cred.name}</p>
                      <p className="text-xs text-gray-400">
                        {cred.type} • Added {new Date(cred.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteCredential(cred.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Actions */}
          <div>
            <h3 className="text-white font-semibold mb-3">Available Actions ({integration.actions.length})</h3>
            <div className="space-y-2 max-h-60 overflow-auto">
              {integration.actions.map((action) => (
                <div key={action.id} className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded font-mono">
                      {action.method}
                    </span>
                    <p className="text-white font-medium">{action.name}</p>
                  </div>
                  <p className="text-sm text-gray-400">{action.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Available Triggers */}
          {integration.triggers.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">Available Triggers ({integration.triggers.length})</h3>
              <div className="space-y-2">
                {integration.triggers.map((trigger) => (
                  <div key={trigger.id} className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-white font-medium mb-1">{trigger.name}</p>
                    <p className="text-sm text-gray-400">{trigger.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add Credential Modal
const AddCredentialModal: React.FC<{
  integration: APIIntegration;
  onClose: () => void;
  onSave: () => void;
}> = ({ integration, onClose, onSave }) => {
  const [name, setName] = useState(`${integration.name} - ${Date.now()}`);
  const [showSecrets, setShowSecrets] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Form fields based on auth type
  const [apiKey, setApiKey] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Special handling for Shopify OAuth2
  const handleShopifyComplete = (token: string, shop: string) => {
    const credential = createCredential(
      integration.id,
      `Shopify - ${shop}`,
      'oauth2',
      {
        accessToken: token,
        shop,
        apiKey: '', // Will be filled from ShopifySetup
        apiSecret: ''
      }
    );

    credentialManager.saveCredential(credential);
    onSave();
  };

  // If Shopify, show OAuth wizard
  if (integration.id === 'shopify') {
    return (
      <ShopifySetup
        onComplete={handleShopifyComplete}
        onCancel={onClose}
      />
    );
  }

  const handleSave = () => {
    let credData: Record<string, string> = {};

    switch (integration.authType) {
      case 'api_key':
        credData = { apiKey };
        break;
      case 'bearer_token':
        credData = { accessToken };
        break;
      case 'basic_auth':
        credData = { username, password };
        break;
      case 'oauth2':
        credData = { accessToken };
        break;
    }

    const credential = createCredential(integration.id, name, integration.authType, credData);
    const validation = validateCredential(credential);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    credentialManager.saveCredential(credential);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-blue-500/30 rounded-xl max-w-2xl w-full">
        <div className="border-b border-slate-800 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Add {integration.name} Credential</h2>
          <p className="text-gray-400">Authentication type: {integration.authType}</p>
        </div>

        <div className="p-6 space-y-4">
          {/* Credential Name */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Credential Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Auth Fields */}
          {integration.authType === 'api_key' && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_live_..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 pr-10"
                />
                <button
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {integration.authType === 'bearer_token' && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Access Token</label>
              <div className="relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Bearer token..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 pr-10"
                />
                <button
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {integration.authType === 'basic_auth' && (
            <>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 pr-10"
                  />
                  <button
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {integration.authType === 'oauth2' && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Access Token</label>
              <div className="relative">
                <input
                  type={showSecrets ? 'text' : 'password'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="OAuth2 access token..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 pr-10"
                />
                <button
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  {errors.map((err, idx) => (
                    <p key={idx} className="text-sm text-red-400">{err}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-semibold"
          >
            Save Credential
          </button>
        </div>
      </div>
    </div>
  );
};
