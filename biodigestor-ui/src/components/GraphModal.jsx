import { FaMicroscope } from 'react-icons/fa';
import GraphViewer from './GraphViewer';

const GraphModal = ({ show, onClose, model }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full h-full rounded-lg overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute mb-4 top-4 right-4 z-10 bg-cyan-700 text-white p-2 rounded-md shadow-lg hover:bg-cyan-800"
        >
          ✕
        </button>
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-semibold flex items-center text-slate-700">
            <FaMicroscope className="text-cyan-700 mr-2" />
            Estructura Causal de la Red Bayesiana
          </h2>
        </div>
        <div className="flex-1 h-full">
          <GraphViewer model={model} />
        </div>
        <div className="p-3 border-t border-slate-200 bg-slate-50">
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
    </div>
  );
};

export default GraphModal;