import { useEffect, useState } from 'react';
import init, { BiodigestorModel } from '../public/pkg/bn_demo.js';
import Header from './components/Header';
import GraphPanel from './components/GraphPanel';
import ControlPanel from './components/ControlPanel';
import GraphModal from './components/GraphModal';
import Footer from './components/Footer';
import './App.css';

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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showGraphModal, setShowGraphModal] = useState(false);

  const isSmallScreen = windowWidth < 768;

  // Resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      
      <Header />

      {/* Contenido Principal - Ocupa todo el espacio restante */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Panel Izquierdo: Visualización de la Red (solo en pantallas medianas y superiores) */}
        {!isSmallScreen && <GraphPanel model={model} />}

        <ControlPanel
          isSmallScreen={isSmallScreen}
          onShowGraphModal={() => setShowGraphModal(true)}
          evidence={evidence}
          onEvidenceChange={handleEvidenceChange}
          results={results}
        />
      </div>

      <GraphModal show={showGraphModal} onClose={() => setShowGraphModal(false)} model={model} />

      <Footer />
    </div>
  );
}

export default App;