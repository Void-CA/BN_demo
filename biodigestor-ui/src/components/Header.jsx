import { FaNetworkWired } from 'react-icons/fa';

const Header = () => {
  return (
    <div className="bg-gradient-to-r from-cyan-950 to-slate-900 text-white py-4 px-6 shadow-lg shrink-0">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Monitor de Biodigestor Inteligente</h1>
        <p className="opacity-90 flex items-center text-sm md:text-base">
          <FaNetworkWired className="text-blue-200 mr-2" />
          Motor de Inferencia Bayesiana y Grafo Causal
        </p>
      </div>
    </div>
  );
};

export default Header;