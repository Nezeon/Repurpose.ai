import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import Card from '../common/Card';

const COLORS = {
  drug: '#FFE600',
  indication: '#00D4AA',
  evidence: '#64748B',
  edge: '#243044',
  edgeActive: '#00D4AA',
  bg: '#0a0f1a',
};

const SOURCE_COLORS = {
  'clinical_trial': '#00B4D8',
  'patent': '#FBBF24',
  'scientific_literature': '#8B5CF6',
  'web': '#10B981',
  'iqvia': '#F472B6',
  'exim': '#FB923C',
  'internal': '#94A3B8',
  'default': '#64748B',
};

const EvidenceGraph = ({ drugName = 'Drug', opportunities = [], allEvidence = [] }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const width = 700;
  const height = 500;
  const cx = width / 2;
  const cy = height / 2;

  // Build graph data
  const graphData = useMemo(() => {
    const topOpps = opportunities.slice(0, 8);
    const indicationRadius = Math.min(width, height) * 0.3;
    const evidenceRadius = Math.min(width, height) * 0.44;

    // Drug center node
    const drugNode = { id: 'drug', label: drugName, x: cx, y: cy, type: 'drug', size: 28 };

    // Indication nodes in a circle
    const indicationNodes = topOpps.map((opp, i) => {
      const angle = (2 * Math.PI * i) / topOpps.length - Math.PI / 2;
      const score = opp.composite_score?.overall_score || opp.confidence_score || 50;
      const size = 10 + (score / 100) * 16;
      return {
        id: `ind-${i}`,
        label: opp.indication,
        x: cx + Math.cos(angle) * indicationRadius,
        y: cy + Math.sin(angle) * indicationRadius,
        type: 'indication',
        size,
        score,
        evidenceCount: opp.evidence_count || 0,
        angle,
      };
    });

    // Group evidence by source type per indication
    const evidenceNodes = [];
    const evidenceEdges = [];
    let evidenceIdx = 0;

    topOpps.forEach((opp, oppIdx) => {
      const indEvidence = allEvidence.filter(
        e => e.indication?.toLowerCase() === opp.indication?.toLowerCase()
      );

      // Group by source
      const sourceGroups = {};
      indEvidence.forEach(e => {
        const src = e.source?.toLowerCase().replace(/\s+/g, '_') || 'default';
        if (!sourceGroups[src]) sourceGroups[src] = [];
        sourceGroups[src].push(e);
      });

      const groupKeys = Object.keys(sourceGroups);
      const indAngle = indicationNodes[oppIdx].angle;

      groupKeys.forEach((src, srcIdx) => {
        const spreadAngle = indAngle + ((srcIdx - (groupKeys.length - 1) / 2) * 0.15);
        const evNode = {
          id: `ev-${evidenceIdx}`,
          label: `${src.replace(/_/g, ' ')} (${sourceGroups[src].length})`,
          x: cx + Math.cos(spreadAngle) * evidenceRadius,
          y: cy + Math.sin(spreadAngle) * evidenceRadius,
          type: 'evidence',
          size: 4 + Math.min(sourceGroups[src].length, 8),
          source: src,
          count: sourceGroups[src].length,
          indicationId: `ind-${oppIdx}`,
        };
        evidenceNodes.push(evNode);
        evidenceEdges.push({
          from: `ind-${oppIdx}`,
          to: evNode.id,
          strength: Math.min(sourceGroups[src].length / 5, 1),
        });
        evidenceIdx++;
      });
    });

    // Drug → Indication edges
    const drugEdges = indicationNodes.map(node => ({
      from: 'drug',
      to: node.id,
      strength: (node.score || 50) / 100,
    }));

    const nodes = [drugNode, ...indicationNodes, ...evidenceNodes];
    const edges = [...drugEdges, ...evidenceEdges];

    return { nodes, edges, indicationNodes, evidenceNodes };
  }, [opportunities, allEvidence, drugName, cx, cy, width, height]);

  const getNodeById = useCallback((id) => {
    return graphData.nodes.find(n => n.id === id);
  }, [graphData]);

  // Determine which edges/nodes are active
  const isNodeActive = useCallback((nodeId) => {
    if (!selectedNode) return true;
    if (nodeId === selectedNode) return true;
    // If selected is an indication, show connected evidence + drug
    return graphData.edges.some(e =>
      (e.from === selectedNode && e.to === nodeId) ||
      (e.to === selectedNode && e.from === nodeId)
    );
  }, [selectedNode, graphData.edges]);

  const isEdgeActive = useCallback((edge) => {
    if (!selectedNode) return true;
    return edge.from === selectedNode || edge.to === selectedNode;
  }, [selectedNode]);

  const tooltip = hoveredNode ? getNodeById(hoveredNode) : null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-text-muted tracking-widest uppercase">
            Evidence Network Graph
          </h3>
          <p className="text-[11px] text-text-muted mt-1">
            Click a node to highlight connections. {opportunities.length} indications, {allEvidence.length} evidence items.
          </p>
        </div>
        {selectedNode && (
          <button
            onClick={() => setSelectedNode(null)}
            className="text-xs text-brand-yellow hover:text-brand-yellow/80 transition-colors"
          >
            Reset view
          </button>
        )}
      </div>

      <div className="relative overflow-hidden rounded-xl bg-brand-darker border border-brand-border/30">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ maxHeight: '500px' }}
        >
          {/* Edges */}
          {graphData.edges.map((edge, i) => {
            const from = getNodeById(edge.from);
            const to = getNodeById(edge.to);
            if (!from || !to) return null;
            const active = isEdgeActive(edge);
            return (
              <motion.line
                key={`edge-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={active ? COLORS.edgeActive : COLORS.edge}
                strokeWidth={active ? 1 + edge.strength * 1.5 : 0.5}
                strokeOpacity={active ? 0.3 + edge.strength * 0.4 : 0.08}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: i * 0.02 }}
              />
            );
          })}

          {/* Evidence nodes (ring 2) */}
          {graphData.evidenceNodes.map((node) => {
            const active = isNodeActive(node.id);
            const color = SOURCE_COLORS[node.source] || SOURCE_COLORS.default;
            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size}
                  fill={color}
                  fillOpacity={active ? 0.6 : 0.1}
                  stroke={color}
                  strokeWidth={active ? 1 : 0.5}
                  strokeOpacity={active ? 0.8 : 0.2}
                  className="cursor-pointer"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.indicationId)}
                />
              </g>
            );
          })}

          {/* Indication nodes (ring 1) */}
          {graphData.indicationNodes.map((node) => {
            const active = isNodeActive(node.id);
            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={node.size}
                  fill={COLORS.indication}
                  fillOpacity={active ? 0.25 : 0.05}
                  stroke={COLORS.indication}
                  strokeWidth={active ? 2 : 0.8}
                  strokeOpacity={active ? 0.9 : 0.2}
                  className="cursor-pointer"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.15 }}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                />
                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + node.size + 12}
                  textAnchor="middle"
                  className="text-[9px] font-medium fill-current"
                  fill={active ? '#CBD5E1' : '#475569'}
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + '...' : node.label}
                </text>
              </g>
            );
          })}

          {/* Center drug node */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={28}
            fill={COLORS.drug}
            fillOpacity={0.15}
            stroke={COLORS.drug}
            strokeWidth={2.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0 }}
            className="cursor-pointer"
            onClick={() => setSelectedNode(null)}
          />
          <text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[11px] font-bold"
            fill={COLORS.drug}
          >
            {drugName.length > 12 ? drugName.slice(0, 10) + '...' : drugName}
          </text>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none bg-brand-slate border border-brand-border rounded-lg px-3 py-2 shadow-lg z-10"
            style={{
              left: `${(tooltip.x / width) * 100}%`,
              top: `${(tooltip.y / height) * 100 - 12}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="text-xs font-semibold text-text-primary capitalize">{tooltip.label}</p>
            {tooltip.score && (
              <p className="text-[10px] text-text-muted">Score: {Math.round(tooltip.score)}</p>
            )}
            {tooltip.count && (
              <p className="text-[10px] text-text-muted">{tooltip.count} evidence items</p>
            )}
            {tooltip.evidenceCount > 0 && (
              <p className="text-[10px] text-text-muted">{tooltip.evidenceCount} evidence items</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: COLORS.drug, backgroundColor: `${COLORS.drug}20` }} />
          <span className="text-[10px] text-text-muted">Drug</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: COLORS.indication, backgroundColor: `${COLORS.indication}20` }} />
          <span className="text-[10px] text-text-muted">Indication</span>
        </div>
        {Object.entries(SOURCE_COLORS).filter(([k]) => k !== 'default').slice(0, 5).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, opacity: 0.7 }} />
            <span className="text-[10px] text-text-muted capitalize">{key.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EvidenceGraph;
