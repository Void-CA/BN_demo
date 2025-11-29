use std::collections::HashMap;
use wasm_bindgen::prelude::*;

// Importaciones necesarias de tu librería suma_core
use suma_core::core::probability::bayes::BayesianNetwork;
use suma_core::core::probability::bayes::BN_base::{BayesianNetworkBase, State};
use console_error_panic_hook; // Para ver errores en el navegador

mod build;
use build::build_network_internal;

// --- 1. Definición del Struct ---

#[wasm_bindgen]
pub struct BiodigestorModel {
    network: BayesianNetwork,
}

#[derive(serde::Serialize)]
pub struct WasmNode {
    pub id: String, 
    pub label: String,
    pub group: String, 
}

#[derive(serde::Serialize)]
pub struct WasmEdge {
    pub from: String, 
    pub to: String,   
}

#[derive(serde::Serialize)]
pub struct WasmGraph {
    pub nodes: Vec<WasmNode>,
    pub edges: Vec<WasmEdge>,
}

// --- 2. Implementación de Métodos Wasm ---

#[wasm_bindgen]
impl BiodigestorModel {

    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<BiodigestorModel, JsValue> {
        console_error_panic_hook::set_once();

        let network = build_network_internal()
            .map_err(|e| JsValue::from_str(&format!("Error building network: {}", e)))?;

        Ok(BiodigestorModel { network })
    }

    // Función de Inferencia
    #[wasm_bindgen]
    pub fn infer(&self, evidence_js: JsValue, target_node: &str) -> Result<JsValue, JsValue> {

        let evidence_map: HashMap<String, String> = serde_wasm_bindgen::from_value(evidence_js)
            .map_err(|e| JsValue::from_str(&format!("Invalid evidence format: {}", e)))?;

        let mut internal_evidence: HashMap<usize, State> = HashMap::new();

        for (node_name, state_val) in evidence_map {
            // CONVERSIÓN CORREGIDA: Usamos el from_str que mapea el string al Estado.
            let state = State::from_str(&state_val);

            let node_id = self.network.get_id_from_name(&node_name)
                .ok_or_else(|| JsValue::from_str(&format!("Node not found: {}", node_name)))?;

            internal_evidence.insert(node_id, state);
        }

        let target_id = self.network.get_id_from_name(target_node)
            .ok_or_else(|| JsValue::from_str(&format!("Target node not found: {}", target_node)))?;

        // Ejecutar Inferencia (Asumimos que devuelve HashMap<State, f64>)
        let distribution = self.network.likelihood_weighting_sampling(
            &internal_evidence,
            target_id,
            10_000
        );

        // Convertir resultados de State a String para JS
        let mut result_js: HashMap<String, f64> = HashMap::new();

        for (state, prob) in distribution {
            let state_str = match state {
                State::True => "True".to_string(), // Si usas "True" en el modelo
                State::False => "False".to_string(), // Si usas "False" en el modelo
                State::Value(s) => s, // Devuelve el string original ("Bueno", "Fuga", "bajo", etc.)
                _ => format!("{:?}", state),
            };
            result_js.insert(state_str, prob);
        }

        Ok(serde_wasm_bindgen::to_value(&result_js)?)
    }

    /// Obtiene la lista de todos los nombres de nodos
    #[wasm_bindgen]
    pub fn get_node_names(&self) -> JsValue {
        // Necesitas tener un método en suma_core que te dé la lista de nombres
        // Usaremos una lista hardcoded para la UI para evitar problemas de Trait.
        let names = vec![
            "EstadoMicrobiano", "EstadoOperativo",
            "TemperaturaReal", "CaudalReal",
            "T_sensor", "Flow_sensor", "pH_sensor", "Gas_sensor", "Presion_sensor"
        ];

        serde_wasm_bindgen::to_value(&names).unwrap()
    }

    #[wasm_bindgen]
    pub fn get_node_cpt(&self, node: &str) -> JsValue {
            let cpt = self.network.get_node_cpt_by_name(node);
            serde_wasm_bindgen::to_value(&cpt).unwrap()
    }

    #[wasm_bindgen(js_name = "getGraphStructure")]
    pub fn get_graph_structure(&self) -> Result<JsValue, JsValue> {
        let mut nodes: Vec<WasmNode> = Vec::new();
        let mut edges: Vec<WasmEdge> = Vec::new();

        // ⚠️ Nota: Necesitas exponer get_id_to_name y get_name_from_id en suma_core 
        // o implementar aquí la iteración de IDs y Nombres.
        // Asumiremos que puedes iterar los IDs para obtener la estructura.
        
        let node_ids = self.network.get_nodes(); // Obtener todos los IDs de nodo

        for node_id in node_ids {
            if let Some(node_name) = self.network.get_name_from_id(node_id) {
                
                // Determinar el grupo
                let group = match node_name.as_str() {
                    "EstadoMicrobiano" | "EstadoOperativo" => "Oculto",
                    n if n.contains("Real") => "Físico",
                    _ => "Sensor",
                };

                // Crear nodo Wasm
                nodes.push(WasmNode {
                    id: node_name.clone(),
                    label: node_name.clone(),
                    group: group.to_string(),
                });

                // Crear aristas
                let children_ids = self.network.get_children(node_id);
                for child_id in children_ids {
                    if let Some(child_name) = self.network.get_name_from_id(child_id) {
                        edges.push(WasmEdge {
                            from: node_name.clone(),
                            to: child_name.clone(),
                        });
                    }
                }
            }
        }

        let graph_data = WasmGraph { nodes, edges };

        serde_wasm_bindgen::to_value(&graph_data)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }
}



