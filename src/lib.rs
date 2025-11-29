mod build;

use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use suma_core::core::probability::bayes::BayesianNetwork;
use suma_core::core::probability::bayes::BN_base::{BayesianNetworkBase, State};
use build::build_biodigester_network;

#[wasm_bindgen]
pub struct BiodigestorModel {
    network: BayesianNetwork,
}

#[wasm_bindgen]
impl BiodigestorModel {

    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<BiodigestorModel, JsValue> {
        // Habilita mejores mensajes de error en la consola del navegador
        console_error_panic_hook::set_once();

        let network = build_biodigester_network();

        Ok(BiodigestorModel { network: network? })
    }

    /// Infiere la probabilidad de los estados de un nodo objetivo dada una evidencia.
    ///
    /// # Args
    /// * `evidence_js`: Objeto JS { "T_sensor": "alta", "Flow_sensor": "bajo" }
    /// * `target_node`: Nombre del nodo a consultar (ej: "EstadoMicrobiano")
    #[wasm_bindgen]
    pub fn infer(&self, evidence_js: JsValue, target_node: &str) -> Result<JsValue, JsValue> {

        // 1. Convertir JS Object -> HashMap<String, String>
        let evidence_map: HashMap<String, String> = serde_wasm_bindgen::from_value(evidence_js)
            .map_err(|e| JsValue::from_str(&format!("Invalid evidence format: {}", e)))?;

        // 2. Preparar evidencia interna (Mapear Nombres -> IDs y Strings -> State)
        let mut internal_evidence: HashMap<usize, State> = HashMap::new();

        for (node_name, state_val) in evidence_map {
            // A. Obtener ID
            let node_id = self.network.get_id_from_name(&node_name)
                .ok_or_else(|| JsValue::from_str(&format!("Node not found: {}", node_name)))?;

            // B. Convertir valor a State (usando tu método from_str)
            // Asumimos que State::from_str maneja "alta", "baja", "True", etc.
            let state = State::from_str(&state_val);

            internal_evidence.insert(node_id, state);
        }

        // 3. Obtener ID del objetivo
        let target_id = self.network.get_id_from_name(target_node)
            .ok_or_else(|| JsValue::from_str(&format!("Target node not found: {}", target_node)))?;

        // 4. Ejecutar Rejection Sampling (Debe devolver HashMap<State, f64>)
        // Asegúrate de usar la versión corregida de rejection_sampling que devuelve map
        let distribution = self.network.rejection_sampling(
            &internal_evidence,
            target_id,
            10_000 // Muestras
        );

        // 5. Convertir resultado (HashMap<State, f64>) a JS Object
        let mut result_js: HashMap<String, f64> = HashMap::new();

        for (state, prob) in distribution {
            let state_str = match state {
                State::True => "True".to_string(),
                State::False => "False".to_string(),
                State::Value(s) => s,
            };
            result_js.insert(state_str, prob);
        }

        Ok(serde_wasm_bindgen::to_value(&result_js)?)
    }

    /// Obtiene la lista de todos los nombres de nodos (para llenar selectores en UI)
    #[wasm_bindgen]
    pub fn get_node_names(&self) -> JsValue {
        // Necesitas exponer el mapa name_to_id o iterar
        // Aquí asumimos que tienes un método get_all_node_names o similar
        // Si no, iteramos ids si es posible o devolvemos una lista hardcoded por ahora
        let names = vec![
            "EstadoMicrobiano", "EstadoOperativo",
            "TemperaturaReal", "CaudalReal",
            "T_sensor", "Flow_sensor"
        ];
        serde_wasm_bindgen::to_value(&names).unwrap()
    }
}

