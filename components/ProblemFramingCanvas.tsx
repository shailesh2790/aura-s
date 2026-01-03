/**
 * Problem Framing Canvas - Force PMs to explicitly frame problems
 *
 * This is the key differentiator of AURA OS as an AI PM Operating System.
 * Forces PMs to surface assumptions and test problem framing BEFORE execution.
 */

import { useState } from 'react';
import { Lightbulb, AlertTriangle, Target, Sparkles, ArrowRight, Save, RefreshCw } from 'lucide-react';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true
});

interface Assumption {
  assumption: string;
  risk_if_wrong: string;
  how_to_test: string;
  confidence: number;
}

interface FramingAnalysis {
  assumptions: Assumption[];
  risks: string[];
  success_criteria_suggestions: string[];
  alternative_framings: string[];
  confidence_score: number;
}

export default function ProblemFramingCanvas() {
  const [problemStatement, setProblemStatement] = useState('');
  const [successCriteria, setSuccessCriteria] = useState<string[]>(['']);
  const [analysis, setAnalysis] = useState<FramingAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeProblemFraming = async () => {
    if (!problemStatement.trim()) return;

    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        temperature: 0,
        messages: [{
          role: 'user',
          content: `You are an expert PM coach helping PMs frame problems correctly.

Problem Statement: "${problemStatement}"

Analyze this problem framing and return a JSON object with:

{
  "assumptions": [
    {
      "assumption": "What assumption is being made?",
      "risk_if_wrong": "What happens if this assumption is wrong?",
      "how_to_test": "How can we test this assumption?",
      "confidence": 0.7
    }
  ],
  "risks": ["Risk 1", "Risk 2"],
  "success_criteria_suggestions": ["Criterion 1", "Criterion 2"],
  "alternative_framings": ["Alternative way to frame this problem"],
  "confidence_score": 0.8
}

Rules:
- Surface 3-5 hidden assumptions
- Identify real risks if framing is wrong
- Suggest measurable success criteria
- Provide 1-2 alternative problem framings
- Rate overall framing quality (0-1)

Return ONLY the JSON object, no other text.`
        }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // Remove markdown code blocks if present
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const framingAnalysis: FramingAnalysis = JSON.parse(jsonText.trim());
      setAnalysis(framingAnalysis);

      // Auto-populate success criteria if empty
      if (successCriteria.length === 1 && !successCriteria[0]) {
        setSuccessCriteria(framingAnalysis.success_criteria_suggestions.slice(0, 3));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze framing');
    } finally {
      setAnalyzing(false);
    }
  };

  const addSuccessCriterion = () => {
    setSuccessCriteria([...successCriteria, '']);
  };

  const updateSuccessCriterion = (index: number, value: string) => {
    const updated = [...successCriteria];
    updated[index] = value;
    setSuccessCriteria(updated);
  };

  const removeSuccessCriterion = (index: number) => {
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const framing = {
      problemStatement,
      successCriteria: successCriteria.filter(c => c.trim()),
      analysis,
      savedAt: new Date().toISOString()
    };

    const saved = JSON.parse(localStorage.getItem('aura_problem_framings') || '[]');
    saved.unshift({ id: Date.now(), ...framing });

    if (saved.length > 10) saved.splice(10);

    localStorage.setItem('aura_problem_framings', JSON.stringify(saved));
    alert('Problem framing saved!');
  };

  const handleProceed = () => {
    alert('Next: Sandbox Runtime - Test your solution in a safe environment with synthetic data!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Lightbulb size={32} className="text-purple-600" />
            <h1 className="text-3xl font-bold text-slate-900">Problem Framing Canvas</h1>
          </div>
          <p className="text-slate-600">
            Frame your problem explicitly before AI builds anything. Surface assumptions, identify risks, define success.
          </p>
        </div>

        {/* Problem Statement */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            What problem are you solving?
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Be specific. Avoid solutions disguised as problems (bad: "We need a chatbot", good: "Users abandon checkout because they can't find shipping info")
          </p>

          <textarea
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            placeholder="Enter the problem you're trying to solve..."
            className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-slate-900 placeholder-slate-400 font-medium"
          />

          <button
            onClick={analyzeProblemFraming}
            disabled={analyzing || !problemStatement.trim()}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Analyzing Problem Framing...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Analyze Problem Framing
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={20} />
              <span className="font-semibold">Analysis Failed</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Framing Quality Score */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Framing Quality</h3>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-purple-600">
                    {(analysis.confidence_score * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate-500">confidence</div>
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{ width: `${analysis.confidence_score * 100}%` }}
                />
              </div>

              {analysis.confidence_score < 0.6 && (
                <p className="mt-3 text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
                  ⚠️ Low confidence - Consider reframing your problem more specifically
                </p>
              )}
            </div>

            {/* Assumptions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Hidden Assumptions</h3>
              <p className="text-sm text-slate-600 mb-4">
                These assumptions are baked into your problem framing. If they're wrong, your solution might fail.
              </p>

              <div className="space-y-4">
                {analysis.assumptions.map((assumption, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">Assumption #{i + 1}</h4>
                      <span className="text-xs px-2 py-1 bg-slate-100 rounded">
                        {(assumption.confidence * 100).toFixed(0)}% sure
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 mb-2">
                      <strong>Assumes:</strong> {assumption.assumption}
                    </p>

                    <p className="text-sm text-red-600 mb-2">
                      <strong>⚠️ If wrong:</strong> {assumption.risk_if_wrong}
                    </p>

                    <p className="text-sm text-green-600">
                      <strong>✅ How to test:</strong> {assumption.how_to_test}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            {analysis.risks.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Potential Risks</h3>
                <ul className="space-y-2">
                  {analysis.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternative Framings */}
            {analysis.alternative_framings.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Alternative Framings</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Consider framing the problem differently:
                </p>
                <div className="space-y-3">
                  {analysis.alternative_framings.map((alt, i) => (
                    <div key={i} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-slate-700">{alt}</p>
                      <button
                        onClick={() => setProblemStatement(alt)}
                        className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        Use this framing
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Criteria */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Success Criteria</h3>
              <p className="text-sm text-slate-600 mb-4">
                How will you measure success? Be specific and measurable.
              </p>

              <div className="space-y-3">
                {successCriteria.map((criterion, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={criterion}
                      onChange={(e) => updateSuccessCriterion(i, e.target.value)}
                      placeholder="e.g., Reduce checkout abandonment by 20%"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 placeholder-slate-400"
                    />
                    {successCriteria.length > 1 && (
                      <button
                        onClick={() => removeSuccessCriterion(i)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addSuccessCriterion}
                className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                + Add criterion
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save Framing
              </button>
              <button
                onClick={handleProceed}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Sandbox
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
