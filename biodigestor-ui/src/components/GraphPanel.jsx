import { FaMicroscope, FaExpand } from 'react-icons/fa';
import GraphViewer from './GraphViewer';

const GraphPanel = ({ model }) => {
  return (
    <div className="basis-[70%] bg-white m-2 md:m-4 rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="text-lg font-semibold flex items-center text-slate-700">
          <FaMicroscope className="text-cyan-700 mr-2" />
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
  );
};

export default GraphPanel;