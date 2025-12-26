
import React, { useMemo } from 'react';
import { WorkflowNode, WorkflowEdge } from '../types';
import { Bot, Terminal, GitFork, PlayCircle, CircleStop, Settings2, Database, Zap } from 'lucide-react';

interface ArchitectureGraphProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  activeNodeId?: string | null;
  onNodeClick: (node: WorkflowNode) => void;
}

const ArchitectureGraph: React.FC<ArchitectureGraphProps> = ({ nodes, edges, activeNodeId, onNodeClick }) => {
  // Enhanced Layout Algorithm
  const layoutNodes = useMemo(() => {
    if (!nodes.length) return [];

    const NODE_WIDTH = 250;
    const NODE_HEIGHT = 100;
    const GAP_X = 150;
    const GAP_Y = 120;

    // 1. Identify Levels (Topological Sort approximation)
    const levels: Record<string, number> = {};
    const inDegree: Record<string, number> = {};
    
    nodes.forEach(n => {
        levels[n.id] = 0;
        inDegree[n.id] = 0;
    });

    edges.forEach(e => {
        if (inDegree[e.target] !== undefined) {
            inDegree[e.target]++;
        }
    });

    // Start with nodes having 0 in-degree or specifically 'start' type
    const queue = nodes.filter(n => n.type === 'start' || inDegree[n.id] === 0).map(n => n.id);
    // If cycle or no clear start, just pick the first one
    if (queue.length === 0 && nodes.length > 0) queue.push(nodes[0].id);

    const visited = new Set<string>();
    
    // Assign levels
    while(queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const currentLvl = levels[currentId];
        const outgoing = edges.filter(e => e.source === currentId);
        
        outgoing.forEach(e => {
            const targetId = e.target;
            levels[targetId] = Math.max(levels[targetId], currentLvl + 1);
            if (!visited.has(targetId)) {
                queue.push(targetId);
            }
        });
    }

    // 2. Position Nodes based on Levels
    const nodesByLevel: Record<number, WorkflowNode[]> = {};
    Object.entries(levels).forEach(([id, lvl]) => {
        if (!nodesByLevel[lvl]) nodesByLevel[lvl] = [];
        const node = nodes.find(n => n.id === id);
        if (node) nodesByLevel[lvl].push(node);
    });

    const calculatedNodes = nodes.map(n => {
        const lvl = levels[n.id] || 0;
        const nodesInThisLevel = nodesByLevel[lvl] || [n];
        const index = nodesInThisLevel.indexOf(n);
        
        // Center the graph
        const levelHeight = nodesInThisLevel.length * (NODE_HEIGHT + GAP_Y);
        const yOffset = -(levelHeight / 2) + (index * (NODE_HEIGHT + GAP_Y));

        return {
            ...n,
            x: 100 + (lvl * (NODE_WIDTH + GAP_X)),
            y: 300 + yOffset
        };
    });

    return calculatedNodes;
  }, [nodes, edges]);

  // Helpers for SVG paths
  const getNodePos = (id: string, type: 'source' | 'target') => {
    const n = layoutNodes.find(x => x.id === id);
    if (!n) return { x: 0, y: 0 };
    // Source comes from Right, Target comes to Left
    return type === 'source' 
        ? { x: (n.x || 0) + 240, y: (n.y || 0) + 40 } // 240 is approx width
        : { x: (n.x || 0), y: (n.y || 0) + 40 };
  };

  return (
    <div className="w-full h-full relative bg-[#0f111a] overflow-auto cursor-grab active:cursor-grabbing">
        {/* Infinite Grid Background */}
        <div className="absolute min-w-[2000px] min-h-[2000px] pointer-events-none" 
             style={{ 
                 backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
                 backgroundSize: '20px 20px',
                 opacity: 0.15
             }}>
        </div>

        <div className="min-w-[1500px] min-h-[1000px] relative p-20">
            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                    </marker>
                    <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#facc15" />
                    </marker>
                </defs>
                {edges.map(edge => {
                    const src = getNodePos(edge.source, 'source');
                    const tgt = getNodePos(edge.target, 'target');
                    
                    // Cubic Bezier for smooth flow
                    const controlX1 = src.x + 80;
                    const controlX2 = tgt.x - 80;
                    const path = `M ${src.x} ${src.y} C ${controlX1} ${src.y}, ${controlX2} ${tgt.y}, ${tgt.x} ${tgt.y}`;

                    const isActiveEdge = activeNodeId === edge.source; // Highlight edges from active node

                    return (
                        <g key={edge.id}>
                            <path 
                                d={path} 
                                stroke={isActiveEdge ? '#facc15' : (edge.type === 'conditional' ? '#a855f7' : '#475569')} 
                                strokeWidth={isActiveEdge ? "3" : "2"}
                                fill="none" 
                                strokeDasharray={edge.type === 'conditional' ? "5,5" : "0"}
                                markerEnd={isActiveEdge ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                                className="transition-all duration-300"
                            />
                            {edge.label && (
                                <g>
                                    <rect 
                                        x={(src.x + tgt.x)/2 - (edge.label.length * 4)} 
                                        y={(src.y + tgt.y)/2 - 12} 
                                        width={edge.label.length * 8 + 10} 
                                        height="20" 
                                        rx="4"
                                        fill="#0f172a"
                                        stroke="#334155"
                                    />
                                    <text 
                                        x={(src.x + tgt.x)/2} 
                                        y={(src.y + tgt.y)/2 + 2} 
                                        fill="#94a3b8" 
                                        fontSize="10" 
                                        textAnchor="middle" 
                                        fontFamily="monospace"
                                    >
                                        {edge.label}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Nodes */}
            {layoutNodes.map(node => {
                const isActive = activeNodeId === node.id;
                
                let Icon = Bot;
                let borderColor = "border-sky-500";
                let iconColor = "text-sky-400";
                let bgColor = "bg-slate-800";
                
                if (node.type === 'tool') { Icon = Terminal; borderColor = "border-emerald-500"; iconColor="text-emerald-400"; }
                if (node.type === 'router') { Icon = GitFork; borderColor = "border-purple-500"; iconColor="text-purple-400"; }
                if (node.type === 'start') { Icon = PlayCircle; borderColor = "border-white"; iconColor="text-white"; bgColor="bg-slate-900"; }
                if (node.type === 'end') { Icon = CircleStop; borderColor = "border-slate-600"; iconColor="text-slate-400"; bgColor="bg-slate-900"; }

                const isSelected = activeNodeId === node.id;
                // Safety: fallback if data is undefined
                const nodeData = node.data || {};

                return (
                    <div 
                        key={node.id}
                        onClick={(e) => { e.stopPropagation(); onNodeClick(node); }}
                        style={{ 
                            transform: `translate(${node.x}px, ${node.y}px)`,
                            width: '240px'
                        }}
                        className={`absolute group cursor-pointer transition-all duration-200 z-10 ${isSelected ? 'scale-105 z-20' : ''}`}
                    >
                        {/* Node Card */}
                        <div className={`relative rounded-xl border-2 ${isActive ? 'border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : `${borderColor} shadow-lg`} ${bgColor} overflow-hidden`}>
                            
                            {/* Header */}
                            <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon size={16} className={iconColor} />
                                    <span className="font-bold text-slate-200 text-xs truncate max-w-[150px]">{node.label}</span>
                                </div>
                                <div className="flex gap-1">
                                    {isActive && <ActivityIndicator />}
                                    <Settings2 size={12} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                            
                            {/* Body */}
                            <div className="p-3">
                                <div className="text-[10px] text-slate-400 font-medium leading-relaxed line-clamp-2 min-h-[2.5em]">
                                    {nodeData.role || nodeData.description || "System Node"}
                                </div>
                                
                                {nodeData.tools && nodeData.tools.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {nodeData.tools.slice(0, 3).map(t => (
                                            <span key={t} className="px-1.5 py-0.5 rounded-sm bg-slate-950 border border-slate-700 text-[9px] text-slate-400 font-mono">
                                                {t}
                                            </span>
                                        ))}
                                        {nodeData.tools.length > 3 && (
                                            <span className="px-1.5 py-0.5 text-[9px] text-slate-500">+{nodeData.tools.length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connection Points */}
                        {node.type !== 'start' && (
                            <div className="absolute top-1/2 -left-1.5 w-3 h-3 bg-slate-400 rounded-full border-2 border-slate-900 transform -translate-y-1/2"></div>
                        )}
                        {node.type !== 'end' && (
                            <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-slate-400 rounded-full border-2 border-slate-900 transform -translate-y-1/2"></div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};

const ActivityIndicator = () => (
    <div className="flex gap-0.5">
        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
);

export default ArchitectureGraph;
