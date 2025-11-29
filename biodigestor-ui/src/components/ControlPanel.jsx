import { FaChartPie, FaChartLine, FaSlidersH, FaExclamationTriangle } from 'react-icons/fa';
import { SENSORES, OBJETIVOS } from '../config';

const ControlPanel = ({ isSmallScreen, onShowGraphModal, evidence, onEvidenceChange, results }) => {
  return (
    <div className="flex-1 md:w-96 bg-white m-2 md:m-4 rounded-xl shadow-lg border border-slate-200 overflow-y-auto flex flex-col">

      {/* Encabezado del Panel Derecho */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white shrink-0">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
          <FaChartPie className="text-cyan-700 mr-3" />
          Panel de Control
          {isSmallScreen && (
            <button
              onClick={onShowGraphModal}
              className="ml-auto bg-cyan-800 text-white px-3 py-1 rounded text-sm hover:bg-cyan-900 hover:cursor-pointer transition-colors"
            >
              Ver Grafo
            </button>
          )}
        </h2>
        <p className="text-sm text-slate-600">
          Configure sensores y vea diagnósticos en tiempo real
        </p>
      </div>

      {/* Contenido Principal - Grid de 2 columnas */}
      <div className="flex-1 flex flex-row">

        {/* Columna Derecha: Diagnósticos */}
        <div className="flex-1 p-4 bg-white">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center text-sm">
            <FaChartLine className="text-cyan-700 mr-2" />
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
                    onChange={(e) => onEvidenceChange(sensor.id, e.target.value)}
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
  );
};

export default ControlPanel;