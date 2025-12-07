import { useMemo } from 'react';

interface GraphViewProps {
  data: any[];
  resourceName: string;
}

interface Node {
  id: string;
  label: string;
  group: string;
  x: number;
  y: number;
}

interface Link {
  source: string;
  target: string;
}

export function GraphView({ data, resourceName }: GraphViewProps) {
  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    
    if (!data || data.length === 0) return { nodes, links };

    // Create main nodes
    data.forEach((item, i) => {
      const angle = (i / data.length) * 2 * Math.PI;
      const radius = 200;
      const itemLabel = item.title || item.name || item.email || item.id || 'Unknown';
      
      nodes.push({
        id: item.id || `node-${i}`,
        label: String(itemLabel),
        group: resourceName,
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
      });

      // Find relationships (naive check for _id fields)
      Object.entries(item).forEach(([key, value]) => {
        if (key.endsWith('_id') && typeof value === 'string') {
           // It's a link to something external (we might not have it in 'data', but we can visualize the edge)
           // To make it connected, we'd need the other data. 
           // For now, let's just link to a "ghost" node or checking if it exists in data (self-reference)
           const targetId = value;
           const exists = data.find(d => d.id === targetId);
           if (exists) {
               links.push({ source: item.id, target: targetId });
           }
        }
        
        if (key === 'category_ids' && Array.isArray(value)) {
            // Link to categories? We don't have category nodes here usually. 
            // We could add them as leaf nodes.
        }
      });
    });

    return { nodes, links };
  }, [data, resourceName]);

  return (
    <div className="border rounded-xl bg-white p-4 overflow-hidden flex justify-center items-center min-h-[600px]">
      <svg width="800" height="600" viewBox="0 0 800 600">
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
            </marker>
        </defs>
        
        {links.map((link, i) => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);
            if (!sourceNode || !targetNode) return null;
            
            return (
                <line
                    key={i}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke="#9CA3AF"
                    strokeWidth="1"
                    markerEnd="url(#arrowhead)"
                />
            );
        })}

        {nodes.map((node) => (
          <g key={node.id} className="cursor-pointer hover:opacity-80 transition-opacity">
            <circle
              cx={node.x}
              cy={node.y}
              r="20"
              fill="#3B82F6"
              stroke="#EFF6FF"
              strokeWidth="4"
              className="drop-shadow-sm"
            />
            <text
              x={node.x}
              y={node.y + 35}
              textAnchor="middle"
              fill="#374151"
              fontSize="12"
              fontWeight="500"
              className="pointer-events-none"
            >
              {node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}