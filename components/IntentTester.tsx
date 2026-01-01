/**
 * Intent Tester - Test the Intent Interpreter
 *
 * Allows testing PM goal parsing in the browser
 */

import { useState } from 'react';
import { Brain, Zap, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseIntent, formatAmbiguities, estimateTotalDuration, type Intent } from '../services/intent';

export default function IntentTester() {
  const [pmGoal, setPmGoal] = useState('');
  const [intent, setIntent] = useState<Intent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exampleGoals = [
    'Create a detailed PRD for an AI Tutor module for Class 6-10',
    'Analyze Notion vs Linear vs Coda and give me a summary',
    'Design a user onboarding flow with 3 variants to A/B test',
    'Convert this PRD into 12 actionable Jira stories',
    'Research top 5 project management tools and create comparison doc'
  ];

  const handleParse = async () => {
    if (!pmGoal.trim()) return;

    setLoading(true);
    setError(null);
    setIntent(null);

    try {
      const parsedIntent = await parseIntent(pmGoal);
      setIntent(parsedIntent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse intent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Intent Interpreter</h1>
          </div>
          <p className="text-slate-600">
            Transform PM goals into structured execution plans
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            What would you like to accomplish?
          </label>

          <textarea
            value={pmGoal}
            onChange={(e) => setPmGoal(e.target.value)}
            placeholder="Enter your PM goal in plain English..."
            className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />

          {/* Example Goals */}
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-2">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {exampleGoals.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setPmGoal(example)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs text-slate-700 transition-colors"
                >
                  {example.length > 50 ? example.slice(0, 50) + '...' : example}
                </button>
              ))}
            </div>
          </div>

          {/* Parse Button */}
          <button
            onClick={handleParse}
            disabled={loading || !pmGoal.trim()}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Parsing...
              </>
            ) : (
              <>
                <Zap size={20} />
                Parse Intent
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={20} />
              <span className="font-semibold">Parse Failed</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Intent Display */}
        {intent && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold uppercase">
                      {intent.type}
                    </span>
                    <span className="text-sm text-slate-500">
                      Confidence: {(intent.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-900">{intent.goal}</h2>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={18} />
                  <span className="text-sm">~{estimateTotalDuration(intent)}s</span>
                </div>
              </div>
            </div>

            {/* Ambiguities */}
            {intent.ambiguities.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <AlertCircle size={18} />
                  <span className="font-semibold">Questions to Clarify</span>
                </div>
                <div className="text-sm text-yellow-700">
                  {formatAmbiguities(intent).split('\n').map((q, i) => (
                    <div key={i}>{q}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Execution Plan</h3>
              <div className="space-y-3">
                {intent.tasks.map((task, i) => (
                  <div key={task.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500">Step {i + 1}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                            {task.agent}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-900">{task.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock size={14} />
                        <span className="text-xs">{task.estimated_duration}s</span>
                      </div>
                    </div>

                    {task.outputs.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Outputs: </span>
                        <span className="text-xs text-slate-700">{task.outputs.join(', ')}</span>
                      </div>
                    )}

                    {task.dependencies.length > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-slate-500">Depends on: </span>
                        <span className="text-xs text-slate-700">{task.dependencies.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Agents Required</h4>
                <div className="flex flex-wrap gap-2">
                  {intent.agents.map((agent) => (
                    <span key={agent} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      {agent}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Tools Required</h4>
                <div className="flex flex-wrap gap-2">
                  {intent.tools.map((tool) => (
                    <span key={tool} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Success Criteria */}
            {intent.success_criteria.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Success Criteria</h4>
                <ul className="space-y-1">
                  {intent.success_criteria.map((criterion, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Constraints */}
            {intent.constraints.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Constraints</h4>
                <ul className="space-y-1">
                  {intent.constraints.map((constraint, i) => (
                    <li key={i} className="text-sm text-slate-600">
                      • {constraint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
