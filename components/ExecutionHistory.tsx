import React, { useState, useEffect } from 'react';
import { workflowEngine } from '../services/workflowEngine';
import { WorkflowExecution, ExecutionStepDetail } from '../types/advanced';
import { Clock, CheckCircle, XCircle, Play, RefreshCw, ChevronDown, ChevronRight, AlertTriangle, Zap } from 'lucide-react';

export const ExecutionHistory: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all');

  useEffect(() => {
    loadExecutions();
  }, []);

  const loadExecutions = () => {
    const history = workflowEngine.getExecutionHistory(100);
    setExecutions(history);
  };

  const filteredExecutions = executions.filter(exec => {
    if (filter === 'all') return true;
    return exec.status === filter;
  });

  // PM workflow time savings mapping (actual time vs manual time)
  const timeSavingsMap: { [key: string]: number } = {
    'PRD Generation': 4.5 * 60 * 60 * 1000, // 4.5 hours saved
    'Competitive Analysis': 4 * 60 * 60 * 1000, // 4 hours saved
    'Sprint Report': 2.5 * 60 * 60 * 1000, // 2.5 hours saved
    'Feedback Analysis': 3 * 60 * 60 * 1000, // 3 hours saved
    'User Story Generation': 2 * 60 * 60 * 1000, // 2 hours saved
    'Research': 3.5 * 60 * 60 * 1000 // 3.5 hours saved
  };

  // Calculate total time saved for PM workflows
  const calculateTimeSaved = () => {
    let totalSaved = 0;
    executions.forEach(exec => {
      if (exec.status === 'completed') {
        // Check if workflow name matches any PM workflow
        const matchedWorkflow = Object.keys(timeSavingsMap).find(key =>
          exec.workflowName.toLowerCase().includes(key.toLowerCase())
        );
        if (matchedWorkflow) {
          const manualTime = timeSavingsMap[matchedWorkflow];
          const actualTime = exec.duration || 0;
          totalSaved += (manualTime - actualTime);
        }
      }
    });
    return totalSaved;
  };

  const totalTimeSaved = calculateTimeSaved();
  const hoursSaved = Math.round(totalTimeSaved / (60 * 60 * 1000));

  const stats = {
    total: executions.length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    running: executions.filter(e => e.status === 'running').length,
    timeSaved: hoursSaved
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'failed': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'running': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'running': return <Play className="w-4 h-4 animate-pulse" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-950 to-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Execution History</h1>
          </div>
          <p className="text-gray-400 text-lg">
            View detailed logs and replay past workflow executions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Total Runs</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
          </div>
          <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Failed</p>
            <p className="text-3xl font-bold text-red-400">{stats.failed}</p>
          </div>
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Success Rate</p>
            <p className="text-3xl font-bold text-blue-400">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-aura-600/20 to-purple-600/20 border border-aura-500/40 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <Zap className="w-5 h-5 text-aura-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">Time Saved</p>
            <p className="text-3xl font-bold text-aura-400">{stats.timeSaved}h</p>
            <p className="text-xs text-slate-500 mt-1">vs manual work</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {(['all', 'completed', 'failed', 'running'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg border transition capitalize ${
                filter === f
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-gray-300 hover:bg-slate-700/50'
              }`}
            >
              {f} {f !== 'all' && `(${stats[f]})`}
            </button>
          ))}
        </div>

        {/* Executions List */}
        {filteredExecutions.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 border border-blue-500/30 rounded-xl">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No executions found</p>
            <p className="text-gray-500 text-sm mt-2">Run a workflow to see execution history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExecutions.map((execution) => {
              // Calculate time saved for this execution
              const matchedWorkflow = Object.keys(timeSavingsMap).find(key =>
                execution.workflowName.toLowerCase().includes(key.toLowerCase())
              );
              const timeSavedForExec = matchedWorkflow && execution.status === 'completed'
                ? Math.round((timeSavingsMap[matchedWorkflow] - (execution.duration || 0)) / (60 * 60 * 1000) * 10) / 10
                : null;

              return (<div
                key={execution.id}
                className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-4 hover:border-blue-500 transition cursor-pointer"
                onClick={() => setSelectedExecution(execution)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Status */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(execution.status)}`}>
                      {getStatusIcon(execution.status)}
                      <span className="text-xs font-medium capitalize">{execution.status}</span>
                    </div>

                    {/* Workflow Name */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{execution.workflowName}</h3>
                        {timeSavedForExec && timeSavedForExec > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-aura-500/20 border border-aura-500/30 text-aura-400 text-[10px] font-bold">
                            <Zap size={10} />
                            {timeSavedForExec}h saved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(execution.startedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Duration</p>
                      <p className="text-white font-semibold">{formatDuration(execution.duration)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Steps</p>
                      <p className="text-white font-semibold">{execution.steps.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Trigger</p>
                      <p className="text-white font-semibold capitalize">{execution.trigger.type}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExecution(execution);
                      }}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View Details →
                    </button>
                  </div>
                </div>

                {/* Error Preview */}
                {execution.error && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                    <p className="text-sm text-red-400">{execution.error.message}</p>
                  </div>
                )}
              </div>);
            })}
          </div>
        )}
      </div>

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <ExecutionDetailModal
          execution={selectedExecution}
          onClose={() => setSelectedExecution(null)}
          onReplay={() => {
            // TODO: Implement replay
            alert('Replay functionality - would re-run the workflow with same input');
          }}
        />
      )}
    </div>
  );
};

// Execution Detail Modal
const ExecutionDetailModal: React.FC<{
  execution: WorkflowExecution;
  onClose: () => void;
  onReplay: () => void;
}> = ({ execution, onClose, onReplay }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-blue-500/30 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{execution.workflowName}</h2>
              <p className="text-gray-400">{new Date(execution.startedAt).toLocaleString()}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">✕</button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className={`font-semibold capitalize ${getStepStatusColor(execution.status)}`}>
                {execution.status}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Duration</p>
              <p className="text-white font-semibold">{formatDuration(execution.duration)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Steps</p>
              <p className="text-white font-semibold">{execution.steps.length}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Trigger</p>
              <p className="text-white font-semibold capitalize">{execution.trigger.type}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Input */}
          <div>
            <h3 className="text-white font-semibold mb-3">Input</h3>
            <pre className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
              {JSON.stringify(execution.input, null, 2)}
            </pre>
          </div>

          {/* Steps Timeline */}
          <div>
            <h3 className="text-white font-semibold mb-3">Execution Steps</h3>
            <div className="space-y-2">
              {execution.steps.map((step, idx) => (
                <StepDetail
                  key={step.id}
                  step={step}
                  stepNumber={idx + 1}
                  isExpanded={expandedSteps.has(step.id)}
                  onToggle={() => toggleStep(step.id)}
                />
              ))}
            </div>
          </div>

          {/* Output */}
          {execution.output && (
            <div>
              <h3 className="text-white font-semibold mb-3">Output</h3>
              <pre className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(execution.output, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {execution.error && (
            <div>
              <h3 className="text-white font-semibold mb-3">Error Details</h3>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-2">{execution.error.code}</p>
                <p className="text-red-300 mb-3">{execution.error.message}</p>
                {execution.error.suggestedFix && (
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                    <p className="text-blue-400 text-sm font-semibold mb-1">Suggested Fix:</p>
                    <p className="text-blue-300 text-sm">{execution.error.suggestedFix}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            Close
          </button>
          <button
            onClick={onReplay}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Replay Execution
          </button>
        </div>
      </div>
    </div>
  );
};

// Step Detail Component
const StepDetail: React.FC<{
  step: ExecutionStepDetail;
  stepNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ step, stepNumber, isExpanded, onToggle }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'failed': return 'text-red-400 bg-red-500/20';
      case 'running': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
      {/* Step Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="text-gray-400 font-mono text-sm">#{stepNumber}</span>
          <span className="text-white font-medium">{step.nodeName}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(step.status)}`}>
            {step.status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{formatDuration(step.duration)}</span>
          {step.retries > 0 && (
            <span className="text-yellow-400">
              {step.retries} {step.retries === 1 ? 'retry' : 'retries'}
            </span>
          )}
        </div>
      </button>

      {/* Step Details (Expanded) */}
      {isExpanded && (
        <div className="border-t border-slate-700 p-4 space-y-3">
          {/* Input */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Input</p>
            <pre className="bg-slate-900/50 rounded p-2 text-xs text-gray-300 overflow-x-auto max-h-40">
              {JSON.stringify(step.input, null, 2)}
            </pre>
          </div>

          {/* Output */}
          {step.output && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Output</p>
              <pre className="bg-slate-900/50 rounded p-2 text-xs text-gray-300 overflow-x-auto max-h-40">
                {JSON.stringify(step.output, null, 2)}
              </pre>
            </div>
          )}

          {/* Logs */}
          {step.logs.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Logs ({step.logs.length})</p>
              <div className="bg-slate-900/50 rounded p-2 space-y-1 max-h-40 overflow-auto">
                {step.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                      log.level === 'info' ? 'text-blue-400' :
                      'text-gray-400'
                    }>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-gray-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {step.error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
              <p className="text-red-400 text-sm font-semibold">{step.error.code}</p>
              <p className="text-red-300 text-sm">{step.error.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
