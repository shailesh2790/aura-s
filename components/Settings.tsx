import React, { useState, useRef } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Download, Upload, Trash2, Key, Database, Info, LogOut, User } from 'lucide-react';

export const Settings: React.FC = () => {
  const { saveWorkflowToFile, loadWorkflowFromFile, clearAllData, stats, recentFlows } = useWorkflow();
  const { user, signOut } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadWorkflowFromFile(file);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('aura_api_key_override', apiKey);
      alert('API key saved! Please refresh the page for changes to take effect.');
    }
  };

  const storedApiKey = localStorage.getItem('aura_api_key_override');

  return (
    <div className="h-full overflow-auto p-8 bg-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-slate-900" />
            <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-900">Account</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-900">Email</p>
                <p className="text-sm text-slate-600 mt-1">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* API Key Management */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">API Key Management</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Groq API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Groq API key"
                  className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                >
                  Save
                </button>
              </div>
              {storedApiKey && (
                <p className="text-xs text-green-400 mt-2">
                  ✓ Custom API key is active
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Get your free API key from:{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  https://console.groq.com/keys
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Data Management</h2>
          </div>

          <div className="space-y-3">
            <button
              onClick={saveWorkflowToFile}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              Export All Data (JSON)
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
            >
              <Upload className="w-4 h-4" />
              Import Data from File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={clearAllData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </div>

          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
            <p className="text-xs text-gray-400">
              <strong>Note:</strong> All data is stored locally in your browser. Export your
              workflows regularly to avoid data loss.
            </p>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">System Information</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/50 rounded-lg">
              <p className="text-sm text-gray-400">Total Runs</p>
              <p className="text-2xl font-bold text-white">{stats.totalRuns}</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg">
              <p className="text-sm text-gray-400">Success Rate</p>
              <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg">
              <p className="text-sm text-gray-400">Active Agents</p>
              <p className="text-2xl font-bold text-white">{stats.activeAgents}</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg">
              <p className="text-sm text-gray-400">Workflows Created</p>
              <p className="text-2xl font-bold text-white">{recentFlows.length}</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
            <p className="text-xs text-gray-400">
              <strong>Version:</strong> AURA Automate v1.0.0
            </p>
            <p className="text-xs text-gray-400 mt-1">
              <strong>AI Model:</strong> Groq (Llama 3.3 70B)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              <strong>Storage:</strong> Browser LocalStorage
            </p>
          </div>
        </div>

        {/* About */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">About AURA Automate</h2>
          <p className="text-gray-300 leading-relaxed">
            AURA Automate is a next-generation AI-native multi-agent automation platform.
            It uses Groq's lightning-fast AI (Llama 3.3 70B) to automatically generate, optimize, and execute
            complex workflows using LangGraph architecture. Completely free and open-source!
          </p>
          <div className="mt-4 flex gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              Documentation
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              GitHub
            </a>
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              Get API Key
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
