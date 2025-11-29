import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

const options = {
  layout: {
    hierarchical: {
      direction: 'LR',
      sortMethod: 'directed',
      levelSeparation: 350,
    },
  },
  edges: {
    arrows: 'to',
    smooth: true,
    color: { inherit: true },
  },
  nodes: {
    shape: 'box',
    margin: 10,
    font: { size: 22, color: '#333' },
    shadow: true,
  },
  groups: {
    Oculto: { color: { background: '#FFC72C', border: '#D99D00' }, font: { color: '#000' } },
    Físico: { color: { background: '#A0D8EF', border: '#5C9DAD' }, font: { color: '#000' } },
    Sensor: { color: { background: '#B8F0BA', border: '#73C77B' }, font: { color: '#000' } },
  },
  interaction: {
    hover: true,
    zoomView: false,
    dragView: true,
    navigationButtons: true,
  },
};

// Función MEJORADA para convertir Map a objeto
const convertMapToObject = (map) => {
  if (!map) return {};
  
  console.log("🔄 Converting Map:", map);
  
  // Si es un Map de JavaScript
  if (map instanceof Map) {
    const obj = {};
    map.forEach((value, key) => {
      // Convertir valores que también sean Maps
      if (value instanceof Map) {
        obj[key] = convertMapToObject(value);
      } else if (typeof value === 'object' && value !== null) {
        // Manejar objetos regulares
        obj[key] = value;
      } else {
        obj[key] = value;
      }
    });
    return obj;
  }
  
  // Si ya es un objeto, devolverlo tal cual
  return map;
};

const GraphViewer = ({ model }) => {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [graphData, setGraphData] = useState(null);
  const [nodeCPTs, setNodeCPTs] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipDirection, setTooltipDirection] = useState('top'); // 'top', 'bottom', 'left', 'right'

  // Función para calcular la posición óptima del tooltip
  const calculateOptimalPosition = (nodePosition, tooltipWidth = 320, tooltipHeight = 300) => {
    if (!containerRef.current || !networkRef.current) return { position: nodePosition, direction: 'top' };

    const containerRect = containerRef.current.getBoundingClientRect();
    const network = networkRef.current;
    
    // Convertir coordenadas del canvas a DOM
    const domCoords = network.canvasToDOM(nodePosition);
    
    // Calcular márgenes de seguridad
    const margin = 20;
    
    // Calcular espacio disponible en cada dirección
    const spaceAbove = domCoords.y - margin;
    const spaceBelow = containerRect.height - domCoords.y - margin;
    const spaceLeft = domCoords.x - margin;
    const spaceRight = containerRect.width - domCoords.x - margin;
    
    // Determinar la mejor dirección basada en el espacio disponible
    let direction = 'top';
    
    if (spaceBelow >= tooltipHeight + 50) {
      direction = 'bottom';
    } else if (spaceAbove >= tooltipHeight + 50) {
      direction = 'top';
    } else if (spaceRight >= tooltipWidth + 50) {
      direction = 'right';
    } else if (spaceLeft >= tooltipWidth + 50) {
      direction = 'left';
    } else {
      // Si no hay espacio suficiente en ninguna dirección, forzar arriba o abajo
      direction = spaceBelow > spaceAbove ? 'bottom' : 'top';
    }

    // Ajustar posición según la dirección
    let adjustedX = domCoords.x;
    let adjustedY = domCoords.y;

    switch (direction) {
      case 'top':
        adjustedY = domCoords.y - 40;
        break;
      case 'bottom':
        adjustedY = domCoords.y + 40;
        break;
      case 'left':
        adjustedX = domCoords.x - 40;
        break;
      case 'right':
        adjustedX = domCoords.x + 40;
        break;
    }

    // Ajuste horizontal para evitar desbordamiento
    if (adjustedX - tooltipWidth / 2 < margin) {
      adjustedX = margin + tooltipWidth / 2;
    } else if (adjustedX + tooltipWidth / 2 > containerRect.width - margin) {
      adjustedX = containerRect.width - margin - tooltipWidth / 2;
    }

    return {
      position: { x: adjustedX, y: adjustedY },
      direction: direction
    };
  };

  useEffect(() => {
    if (model) {
      try {
        const data = model.getGraphStructure();
        setGraphData(data);
        
        const loadCPTs = async () => {
          const cpts = {};
          for (const node of data.nodes) {
            try {
              let cptData = await model.get_node_cpt(node.id);
              console.log(`📊 RAW CPT for node ${node.id}:`, cptData);
              
              // Procesar los datos CPT
              cptData = processCPTData(cptData);
              cpts[node.id] = cptData;
              console.log(`✅ PROCESSED CPT for node ${node.id}:`, cptData);
            } catch (e) {
              console.warn(`No CPT for node ${node.id}`);
              cpts[node.id] = null;
            }
          }
          setNodeCPTs(cpts);
        };
        
        loadCPTs();
      } catch (e) {
        console.error("Error loading graph structure:", e);
      }
    }
  }, [model]);

  // Función para procesar datos CPT
  const processCPTData = (cptData) => {
    if (!cptData) return null;
    
    const processed = {};
    
    // Procesar Discrete CPT
    if (cptData.Discrete) {
      processed.Discrete = {
        node_possible_values: cptData.Discrete.node_possible_values || [],
        table: extractTableFromMap(cptData.Discrete.table)
      };
    }
    
    // Procesar Binary CPT
    if (cptData.Binary) {
      processed.Binary = {
        table: cptData.Binary.table || []
      };
    }
    
    return processed;
  };

  // Función ESPECÍFICA para extraer tabla de Maps anidados
  const extractTableFromMap = (tableMap) => {
    if (!tableMap) return {};
    
    console.log("🔍 Extracting table from:", tableMap);
    
    const result = {};
    
    // Si es un Map
    if (tableMap instanceof Map) {
      tableMap.forEach((innerMap, parentKey) => {
        if (innerMap instanceof Map) {
          const distribution = {};
          innerMap.forEach((probability, stateObj) => {
            // stateObj es {Value: "Bajo"}, extraemos el valor
            const stateKey = stateObj.Value || JSON.stringify(stateObj);
            distribution[stateKey] = probability;
          });
          result[parentKey] = distribution;
        }
      });
    } 
    // Si ya es un objeto (por las conversiones anteriores)
    else if (typeof tableMap === 'object') {
      Object.entries(tableMap).forEach(([parentKey, innerMap]) => {
        if (innerMap instanceof Map) {
          const distribution = {};
          innerMap.forEach((probability, stateObj) => {
            const stateKey = stateObj.Value || JSON.stringify(stateObj);
            distribution[stateKey] = probability;
          });
          result[parentKey] = distribution;
        } else {
          result[parentKey] = innerMap;
        }
      });
    }
    
    console.log("📋 Extracted table result:", result);
    return result;
  };

  useEffect(() => {
    if (graphData && containerRef.current) {
      const networkData = {
        nodes: graphData.nodes.map(n => ({ 
          ...n, 
          id: n.id, 
          label: n.label, 
          group: n.group,
        })),
        edges: graphData.edges.map(e => ({ from: e.from, to: e.to })),
      };

      const network = new Network(containerRef.current, networkData, options);
      networkRef.current = network;
      
      network.on("click", (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const nodePosition = network.getPositions([nodeId])[nodeId];
          
          const { position, direction } = calculateOptimalPosition(nodePosition);
          
          setSelectedNode(nodeId);
          setTooltipPosition(position);
          setTooltipDirection(direction);
        } else {
          setSelectedNode(null);
        }
      });

      network.on("dragEnd", (params) => {
        if (params.nodes.length > 0 && params.nodes[0] === selectedNode) {
          const nodeId = params.nodes[0];
          const nodePosition = network.getPositions([nodeId])[nodeId];
          
          const { position, direction } = calculateOptimalPosition(nodePosition);
          
          setTooltipPosition(position);
          setTooltipDirection(direction);
        }
      });

      network.on("zoom", () => setSelectedNode(null));
      network.on("dragStart", () => setSelectedNode(null));

      network.fit();

      return () => {
        network.destroy();
      };
    }
  }, [graphData]);

  // Función mejorada para formatear claves
  const formatKey = (keyString) => {
    if (!keyString) return "Raíz";
    
    try {
      // Si es un objeto, extraer el Value
      if (typeof keyString === 'object' && keyString !== null) {
        return keyString.Value || JSON.stringify(keyString);
      }
      
      // Intentar parsear JSON
      if (typeof keyString === 'string') {
        const parsed = JSON.parse(keyString);
        
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) return "Raíz";
          return parsed.map(item => item.Value || JSON.stringify(item)).join(' ∧ ');
        }
        
        if (typeof parsed === 'object') {
          return parsed.Value || JSON.stringify(parsed);
        }
      }
      
      return keyString;
    } catch (e) {
      // Si no es JSON válido, limpiar el string
      return keyString === '[]' ? 'Raíz' : keyString.replace(/[\[\]"]/g, '');
    }
  };

  // Función para obtener los estilos del tooltip según la dirección
  const getTooltipStyles = () => {
    const baseStyles = {
      position: 'absolute',
      zIndex: 50,
      transition: 'all 0.2s ease-out',
      pointerEvents: 'auto'
    };

    switch (tooltipDirection) {
      case 'top':
        return {
          ...baseStyles,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translate(-50%, -100%)',
          paddingBottom: '15px'
        };
      case 'bottom':
        return {
          ...baseStyles,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translate(-50%, 0)',
          paddingTop: '15px'
        };
      case 'left':
        return {
          ...baseStyles,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translate(-100%, -50%)',
          paddingRight: '15px'
        };
      case 'right':
        return {
          ...baseStyles,
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: 'translate(0, -50%)',
          paddingLeft: '15px'
        };
      default:
        return baseStyles;
    }
  };

  // Función para obtener el estilo de la flecha del tooltip
  const getArrowStyles = () => {
    switch (tooltipDirection) {
      case 'top':
        return {
          position: 'absolute',
          left: '50%',
          bottom: '0',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb'
        };
      case 'bottom':
        return {
          position: 'absolute',
          left: '50%',
          top: '0',
          transform: 'translateX(-50%) rotate(225deg)',
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb'
        };
      case 'left':
        return {
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%) rotate(135deg)',
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb'
        };
      case 'right':
        return {
          position: 'absolute',
          left: '0',
          top: '50%',
          transform: 'translateY(-50%) rotate(315deg)',
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          borderRight: '1px solid #e5e7eb',
          borderBottom: '1px solid #e5e7eb'
        };
      default:
        return {};
    }
  };

  const renderCPTContent = (nodeId) => {
    const node = graphData?.nodes.find(n => n.id === nodeId);
    const cptData = nodeCPTs[nodeId];
    
    if (!node || !cptData) return null;

    return (
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden w-80 text-sm">
        <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
          <div>
            <span className="font-bold block">{node.label}</span>
            <span className="text-xs text-gray-300 opacity-75">{node.group}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedNode(null); }}
            className="text-gray-400 hover:text-white px-2"
          >
            ✕
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto p-2 bg-gray-50">
           {renderCPTTable(cptData)}
        </div>
      </div>
    );
  };

  const renderCPTTable = (cptData) => {
    console.log("🎨 Rendering CPT table with data:", cptData);
    
    if (cptData.Discrete) return renderDiscreteCPT(cptData.Discrete);
    if (cptData.Binary) return renderBinaryCPT(cptData.Binary);
    return <div className="p-2 text-red-500">Formato desconocido</div>;
  };

  const renderBinaryCPT = (binaryCPT) => {
    if (!binaryCPT.table || binaryCPT.table.length === 0) {
        return <div className="p-2 italic text-gray-500">Nodo Raíz (Sin padres)</div>;
    }

    return (
      <div className="flex flex-col gap-2">
        {binaryCPT.table.map((entry, index) => {
          const parents = entry[0] || [];
          const probTrue = entry[1] || 0;
          const probFalse = 1 - probTrue;

          return (
            <div key={index} className="bg-white border rounded p-2 shadow-sm">
               <div className="text-xs font-semibold text-gray-600 mb-1 border-b pb-1">
                 Si: {parents.map(p => p.Value || JSON.stringify(p)).join(' ∧ ')}
               </div>
               
               <div className="flex items-center gap-2 mt-1">
                 <div className="flex-1 h-4 bg-red-100 rounded-sm overflow-hidden flex text-[10px] leading-4 text-center text-white font-bold">
                    <div style={{width: `${probTrue * 100}%`}} className="bg-green-500">
                        {probTrue > 0.2 && 'T'}
                    </div>
                    <div style={{width: `${probFalse * 100}%`}} className="bg-red-400">
                        {probFalse > 0.2 && 'F'}
                    </div>
                 </div>
               </div>
               <div className="flex justify-between text-xs mt-1 text-gray-500">
                    <span>T: {(probTrue * 100).toFixed(0)}%</span>
                    <span>F: {(probFalse * 100).toFixed(0)}%</span>
               </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDiscreteCPT = (discreteCPT) => {
    const possibleValues = discreteCPT.node_possible_values || [];
    const tableData = discreteCPT.table || {};
    const hasTableData = Object.keys(tableData).length > 0;

    console.log("📊 Rendering Discrete CPT:", {
      possibleValues,
      tableData,
      hasTableData,
      entries: Object.entries(tableData)
    });

    return (
      <div className="flex flex-col gap-3 p-1">
        
        {/* SECCIÓN 1: Estados Definidos */}
        <div>
          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Estados Definidos
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {possibleValues.length > 0 ? (
              possibleValues.map((state, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span>
                  {state.Value}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-xs italic">Sin estados definidos</span>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: Tabla de Probabilidades */}
        <div className="border-t border-gray-100 pt-2">
          <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Distribución de Probabilidad
          </h5>
          
          {hasTableData ? (
            <div className="space-y-2">
              {Object.entries(tableData).map(([parentKey, distribution], index) => {
                const cleanParent = formatKey(parentKey);

                return (
                  <div key={index} className="bg-white border border-gray-200 rounded p-2 shadow-sm">
                    <div className="text-xs font-semibold text-gray-700 mb-1 border-b border-gray-100 pb-1">
                      {cleanParent}
                    </div>
                    
                    <div className="space-y-1">
                      {Object.entries(distribution).map(([stateKey, prob]) => {
                        const stateLabel = formatKey(stateKey);
                        
                        return (
                          <div key={stateKey} className="flex items-center text-xs">
                            <span className="w-20 truncate text-right mr-2 text-gray-500">
                              {stateLabel}
                            </span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full" 
                                style={{ width: `${prob * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 font-mono text-gray-600 w-9 text-right">
                              {(prob * 100).toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded p-3 text-center">
              <p className="text-xs text-gray-500 italic">
                Tabla vacía (nodo raíz o sin datos)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <div className="border border-slate-300 rounded-lg bg-gray-50 shadow-inner" style={{ height: '500px' }}>
        <div 
          ref={containerRef} 
          style={{ height: '100%', width: '100%' }}
        >
          {!graphData && (
            <div className="flex items-center justify-center h-full text-slate-400">
               Cargando red bayesiana...
            </div>
          )}
        </div>
      </div>

      {selectedNode && (
        <div style={getTooltipStyles()}>
          <div className="relative">
            {renderCPTContent(selectedNode)}
            <div style={getArrowStyles()}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphViewer;