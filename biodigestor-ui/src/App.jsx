import { useEffect, useState } from 'react';
import init, { BiodigestorModel } from '../public/pkg/bn_demo.js'; 
import GraphViewer from './components/GraphViewer';
import { 
  FaThermometerHalf, 
  FaFlask, 
  FaFire, 
  FaTint, 
  FaMicroscope, 
  FaExclamationTriangle,
  FaSatelliteDish,
  FaBacteria,
  FaToolbox,
  FaTachometerAlt,
  FaExpand,
  FaChartLine,
  FaSlidersH
} from 'react-icons/fa';
import './App.css';

// Configuración de la UI
const SENSORES = [
  { 
    id: 'T_sensor', 
    label: 'Sensor de Temperatura', 
    options: ['baja', 'normal', 'alta'],
    icon: FaThermometerHalf,
    color: 'text-red-500'
  },
  { 
    id: 'pH_sensor', 
    label: 'Sensor de pH', 
    options: ['acido', 'neutro', 'alcalino'],
    icon: FaFlask,
    color: 'text-purple-500'
  },
  { 
    id: 'Gas_sensor', 
    label: 'Sensor de Gas', 
    options: ['bajo', 'normal', 'alto'],
    icon: FaFire,
    color: 'text-orange-500'
  },
  { 
    id: 'Flow_sensor', 
    label: 'Sensor de Caudal', 
    options: ['bajo', 'normal', 'alto'],
    icon: FaTint,
    color: 'text-blue-500'
  },
  { 
    id: 'Presion_sensor', 
    label: 'Sensor de Presión', 
    options: ['baja', 'normal', 'alta'],
    icon: FaTachometerAlt,
    color: 'text-indigo-500'
  },
];

const OBJETIVOS = [
  { 
    id: 'EstadoMicrobiano', 
    label: 'Estado Microbiano',
    icon: FaBacteria,
    color: 'text-green-600',
    bgColor: 'bg-gradient-to-br from-green-50 to-white-100'
  },
  { 
    id: 'EstadoOperativo', 
    label: 'Estado Operativo',
    icon: FaToolbox,
    color: 'text-orange-600',
    bgColor: 'bg-gradient-to-br from-orange-50 to-white-100'
  },
];

function App() {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState({
    T_sensor: 'normal',
    pH_sensor: 'neutro',
    Gas_sensor: 'normal',
    Flow_sensor: 'normal',
    Presion_sensor: 'normal',
  });

  const [results, setResults] = useState({
    EstadoMicrobiano: {},
    EstadoOperativo: {}
  });

  // 1. Cargar WASM al inicio
  useEffect(() => {
    const loadWasm = async () => {
      try {
        await init('/pkg/bn_demo_bg.wasm'); 
        const bn = new BiodigestorModel();
        setModel(bn);
        setLoading(false);
      } catch (e) {
        console.error("Error cargando Motor Bayesiano (Wasm):", e);
      }
    };
    loadWasm();
  }, []);

  // 2. Ejecutar Inferencia para AMBOS objetivos
  useEffect(() => {
    if (!model) return;

    const runInference = () => {
      try {
        const evidencePayload = JSON.parse(JSON.stringify(evidence));
        
        // Inferencia para EstadoMicrobiano
        const probMicrobiano = model.infer(evidencePayload, 'EstadoMicrobiano');
        const microbianoObj = {};
        probMicrobiano.forEach((value, key) => {
          microbianoObj[key] = value;
        });

        // Inferencia para EstadoOperativo
        const probOperativo = model.infer(evidencePayload, 'EstadoOperativo');
        const operativoObj = {};
        probOperativo.forEach((value, key) => {
          operativoObj[key] = value;
        });

        setResults({
          EstadoMicrobiano: microbianoObj,
          EstadoOperativo: operativoObj
        });

      } catch (e) {
        setResults({
          EstadoMicrobiano: {},
          EstadoOperativo: {}
        });
      }
    };
    
    runInference();
  }, [model, evidence]);

  // Handler para cambios en los selectores
  const handleEvidenceChange = (sensorId, value) => {
    setEvidence(prev => ({ ...prev, [sensorId]: value }));
  };

  if (loading) return (
    <div className="h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-xl text-slate-600">Cargando Motor Bayesiano (Wasm)...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-100 flex flex-col overflow-hidden">
      
      {/* Header Fijo */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 shadow-lg shrink-0">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Monitor de Biodigestor Inteligente</h1>
          <p className="opacity-90 flex items-center text-sm">
            <FaChartLine className="text-blue-200 mr-2" />
            Motor de Inferencia Bayesiana (Rust + WebAssembly)
          </p>
        </div>
      </div>

      {/* Contenido Principal - Ocupa todo el espacio restante */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Panel Izquierdo: Visualización de la Red (70% del ancho) */}
        <div className="flex-1 bg-white m-4 rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-white shrink-0">
            <h2 className="text-lg font-semibold flex items-center text-slate-700">
              <FaMicroscope className="text-blue-500 mr-2" />
              Estructura Causal de la Red Bayesiana
              <FaExpand className="text-slate-400 ml-2 text-sm" />
            </h2>
          </div>
          <div className="flex-1 p-4">
            <GraphViewer model={model} />
          </div>
          <div className="p-3 border-t border-slate-200 bg-slate-50 shrink-0">
            <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-600">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-yellow-400 mr-1"></span>
                Nodos Ocultos
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-300 mr-1"></span>
                Estados Físicos Reales
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-300 mr-1"></span>
                Sensores (Evidencia)
              </span>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Sensores y Diagnósticos LADO A LADO */}
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto flex flex-col">
          
          {/* Encabezado del Panel Derecho */}
          <div className="p-4 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white shrink-0">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
              <FaChartLine className="text-blue-600 mr-3" />
              Panel de Control
            </h2>
            <p className="text-sm text-slate-600">
              Configure sensores y vea diagnósticos en tiempo real
            </p>
          </div>

          {/* Contenido Principal - Grid de 2 columnas */}
          <div className="flex-1 flex">

            {/* Columna Derecha: Diagnósticos */}
<div className="flex-1 p-4 bg-white">
  <h3 className="font-semibold text-slate-700 mb-4 flex items-center text-sm">
    <FaChartLine className="text-blue-500 mr-2" />
    Diagnósticos
  </h3>
  
  <div className="space-y-4">
    {OBJETIVOS.map(objetivo => {
      const IconComponent = objetivo.icon;
      const resultData = results[objetivo.id] || {};
      
      return (
        <div key={objetivo.id} className="space-y-6">
          {/* Header del diagnóstico */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 pt-2 mt-10 px-2 rounded">
            <div className="flex items-center">
              <IconComponent className={`${objetivo.color} mr-2 text-base`} />
              <span className="font-semibold text-slate-800 text-sm">{objetivo.label}</span>
            </div>
            <div className="text-xs text-slate-500">
              {Object.keys(resultData).length > 0 ? 'Actualizado' : 'Sin datos'}
            </div>
          </div>

          {/* Estados con diseño de lista */}
          <div className="space-y-1.5">
            {Object.entries(resultData).sort((a,b) => b[1] - a[1]).map(([state, prob]) => {
              const percentage = (prob * 100).toFixed(1);
              
              let barColor = 'bg-blue-400';
              let dotColor = 'bg-blue-400';
              if (['Degradado', 'FallaMecanica', 'Fuga'].includes(state)) {
                barColor = 'bg-red-400';
                dotColor = 'bg-red-400';
              }
              if (['Bueno', 'Normal'].includes(state)) {
                barColor = 'bg-green-400';
                dotColor = 'bg-green-400';
              }

              return (
                <div key={state} className="flex items-center gap-3 py-1.5 hover:bg-slate-50 rounded px-1 transition-colors">
                  {/* Punto indicador */}
                  <div className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`}></div>
                  
                  {/* Estado y porcentaje */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-slate-700 truncate">{state}</span>
                      <span className="text-xs font-bold text-slate-900 ml-2">{percentage}%</span>
                    </div>
                    
                    {/* Barra de progreso integrada */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`${barColor} h-1.5 rounded-full transition-all duration-500 ease-out`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}

            {Object.keys(resultData).length === 0 && (
              <div className="text-center py-3">
                <div className="text-slate-400 text-xs italic">Esperando datos de inferencia...</div>
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>
          
            {/* Columna Izquierda: Sensores */}
            <div className="flex-1 border-r border-slate-200 p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center text-sm">
                <FaSlidersH className="text-slate-500 mr-2" />
                Sensores
              </h3>
              
              <div className="space-y-3">
                {SENSORES.map(sensor => {
                  const IconComponent = sensor.icon;
                  return (
                    <div key={sensor.id} className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
                      <label className="text-xs font-medium text-slate-600 mb-2 flex items-center">
                        <IconComponent className={`${sensor.color} mr-2 text-sm`} />
                        {sensor.label}
                      </label>
                      <select 
                        value={evidence[sensor.id]}
                        onChange={(e) => handleEvidenceChange(sensor.id, e.target.value)}
                        className="p-1.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white text-xs w-full"
                      >
                        {sensor.options.map(opt => (
                          <option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
            

          {/* Alerta Condicional - En la parte inferior */}
          <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            {(results.EstadoMicrobiano?.Degradado > 0.6 || 
              results.EstadoOperativo?.FallaMecanica > 0.6 || 
              results.EstadoOperativo?.Fuga > 0.6) && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-3 border-red-500 p-3 rounded-md shadow-sm">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-red-500 text-base mr-2 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-800">
                      ALERTA CRÍTICA
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Revise equipos físicos
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-2 px-6 text-xs shrink-0">
        <div className="max-w-7xl mx-auto text-center">
          Powered by Rust & WebAssembly • Monitor de Biodigestor Inteligente
        </div>
      </footer>
    </div>
  );
}

export default App;