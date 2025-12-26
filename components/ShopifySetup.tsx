/**
 * Shopify Setup Component
 *
 * OAuth2 flow and configuration for Shopify integration
 */

import React, { useState, useEffect } from 'react';
import { ShopifyClient, SHOPIFY_WEBHOOK_TOPICS, ShopifyWebhookTopic } from '../services/integrations/shopify';
import { Check, X, ExternalLink, Loader2, AlertCircle, Copy, CheckCircle } from 'lucide-react';

interface ShopifySetupProps {
  onComplete: (accessToken: string, shop: string) => void;
  onCancel: () => void;
}

export const ShopifySetup: React.FC<ShopifySetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [shop, setShop] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [webhooks, setWebhooks] = useState<ShopifyWebhookTopic[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const redirectUri = `${window.location.origin}/auth/shopify/callback`;

  const scopes = [
    'read_products',
    'write_products',
    'read_orders',
    'write_orders',
    'read_customers',
    'write_customers',
    'read_checkouts',
    'read_inventory',
    'write_inventory'
  ];

  /**
   * Step 1: Connect Shopify Store
   */
  const handleConnect = () => {
    if (!shop) {
      setError('Please enter your Shopify store URL');
      return;
    }

    if (!apiKey) {
      setError('Please enter your API key');
      return;
    }

    // Normalize shop URL
    let normalizedShop = shop.toLowerCase().trim();
    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = `${normalizedShop}.myshopify.com`;
    }

    // Generate OAuth URL
    const authUrl = ShopifyClient.getAuthorizationUrl(
      normalizedShop,
      apiKey,
      redirectUri,
      scopes
    );

    // Save state for callback
    localStorage.setItem('shopify_oauth_state', JSON.stringify({
      shop: normalizedShop,
      apiKey,
      apiSecret
    }));

    // Redirect to Shopify OAuth
    window.location.href = authUrl;
  };

  /**
   * Step 2: Handle OAuth callback
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state) {
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      const savedState = localStorage.getItem('shopify_oauth_state');
      if (!savedState) {
        throw new Error('OAuth state not found');
      }

      const { shop, apiKey, apiSecret } = JSON.parse(savedState);

      // Exchange code for access token
      const token = await ShopifyClient.exchangeCodeForToken(
        shop,
        apiKey,
        apiSecret,
        code
      );

      setShop(shop);
      setApiKey(apiKey);
      setApiSecret(apiSecret);
      setAccessToken(token);
      setStep(3);

      // Clean up
      localStorage.removeItem('shopify_oauth_state');
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 3: Configure Webhooks
   */
  const handleWebhookSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const client = new ShopifyClient({
        shop,
        apiKey,
        apiSecret,
        accessToken,
        scopes
      });

      // Create webhooks
      for (const topic of webhooks) {
        const address = `${webhookUrl}/${topic.replace('/', '_')}`;
        await client.createWebhook(topic, address);
      }

      setStep(4);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 4: Test Connection
   */
  const handleTestConnection = async () => {
    setLoading(true);
    setError('');

    try {
      const client = new ShopifyClient({
        shop,
        apiKey,
        apiSecret,
        accessToken,
        scopes
      });

      // Test by fetching shop data
      await client.getProducts({ limit: 1 });

      onComplete(accessToken, shop);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-blue-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Connect Shopify</h2>
            <p className="text-slate-400 text-sm mt-1">
              Step {step} of 4: {
                step === 1 ? 'Enter store details' :
                step === 2 ? 'Authorize access' :
                step === 3 ? 'Configure webhooks' :
                'Test connection'
              }
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Error</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Enter Store Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Shopify Store URL
                </label>
                <input
                  type="text"
                  value={shop}
                  onChange={(e) => setShop(e.target.value)}
                  placeholder="your-store.myshopify.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-slate-500 text-xs mt-2">
                  Enter your store's .myshopify.com URL
                </p>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  API Key (Client ID)
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  API Secret (Client Secret)
                </label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Enter your API secret"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 font-semibold mb-2">How to get credentials:</p>
                <ol className="text-blue-300 text-sm space-y-1 list-decimal list-inside">
                  <li>Go to your Shopify Partners dashboard</li>
                  <li>Create a new app or select existing app</li>
                  <li>Copy API key and API secret key</li>
                  <li>Add redirect URL: <code className="bg-slate-800 px-2 py-0.5 rounded">{redirectUri}</code></li>
                </ol>
                <a
                  href="https://partners.shopify.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm mt-3 inline-flex items-center gap-1"
                >
                  Open Shopify Partners <ExternalLink size={14} />
                </a>
              </div>

              <button
                onClick={handleConnect}
                disabled={loading || !shop || !apiKey || !apiSecret}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink size={20} />
                    Connect to Shopify
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Configure Webhooks */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-3">
                  Webhook URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-domain.com/webhooks/shopify"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl)}
                    className="px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
                  >
                    {copied ? <CheckCircle size={20} className="text-green-400" /> : <Copy size={20} className="text-slate-400" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-3">
                  Select Webhook Events
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                  {SHOPIFY_WEBHOOK_TOPICS.map((topic) => (
                    <label
                      key={topic}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                        webhooks.includes(topic)
                          ? 'bg-blue-500/20 border-blue-500/50'
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={webhooks.includes(topic)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhooks([...webhooks, topic]);
                          } else {
                            setWebhooks(webhooks.filter(t => t !== topic));
                          }
                        }}
                        className="form-checkbox text-blue-500"
                      />
                      <span className="text-white text-sm">{topic}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Skip Webhooks
                </button>
                <button
                  onClick={handleWebhookSetup}
                  disabled={loading || !webhookUrl || webhooks.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Webhooks ({webhooks.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Test Connection */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                <Check size={48} className="text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Connected Successfully!</h3>
                <p className="text-green-300">
                  Your Shopify store is now connected to AURA
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <span className="text-slate-400">Store</span>
                  <span className="text-white font-mono">{shop}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <span className="text-slate-400">Access Token</span>
                  <span className="text-white font-mono">
                    {accessToken.substring(0, 20)}...
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <span className="text-slate-400">Webhooks</span>
                  <span className="text-white font-semibold">{webhooks.length} configured</span>
                </div>
              </div>

              <button
                onClick={handleTestConnection}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
