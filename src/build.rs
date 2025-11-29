use std::collections::HashMap;
use suma_core::core::probability::bayes::BayesianNetwork;
use suma_core::core::probability::bayes::BN_base::{BayesianNetworkBase, State};

// Este módulo contiene la definición de la Red Bayesiana del Biodigestor.
pub(crate) fn build_network_internal() -> Result<BayesianNetwork, String> {
     let mut bn = BayesianNetwork::new();

     // --- 1. Nodos raíz (sin padres) ---

     let microbiano_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([(vec![], HashMap::from([("Bueno", 0.85), ("Degradado", 0.15)]))]);
     bn.add_discrete_node("EstadoMicrobiano", vec![], vec!["Bueno", "Degradado"], microbiano_cpt)?;

     let operativo_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([(vec![], HashMap::from([("Normal", 0.95), ("FallaMecanica", 0.03), ("Fuga", 0.02)]))]);
     bn.add_discrete_node("EstadoOperativo", vec![], vec!["Normal", "FallaMecanica", "Fuga"], operativo_cpt)?;

     // --- 2. Nodos físicos/intermedios ---

     let temp_real_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Bueno"], HashMap::from([("Normal", 0.9), ("Baja", 0.05), ("Alta", 0.05)])),
          (vec!["Degradado"], HashMap::from([("Baja", 0.6), ("Normal", 0.3), ("Alta", 0.1)])),
     ]);
     bn.add_discrete_node("TemperaturaReal", vec!["EstadoMicrobiano"], vec!["Baja","Normal","Alta"], temp_real_cpt)?;

     let ph_real_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Bueno"], HashMap::from([("Neutro", 0.85), ("Acido", 0.1), ("Alcalino", 0.05)])),
          (vec!["Degradado"], HashMap::from([("Acido", 0.6), ("Neutro", 0.3), ("Alcalino", 0.1)])),
     ]);
     bn.add_discrete_node("pHReal", vec!["EstadoMicrobiano"], vec!["Acido","Neutro","Alcalino"], ph_real_cpt)?;

     let caudal_real_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Normal"], HashMap::from([("Normal", 0.9), ("Bajo", 0.05), ("Alto", 0.05)])),
          (vec!["Fuga"], HashMap::from([("Alto", 0.7), ("Normal", 0.2), ("Bajo", 0.1)])),
          (vec!["FallaMecanica"], HashMap::from([("Bajo", 0.8), ("Normal", 0.15), ("Alto", 0.05)])),
     ]);
     bn.add_discrete_node("CaudalReal", vec!["EstadoOperativo"], vec!["Bajo","Normal","Alto"], caudal_real_cpt)?;

     let presion_real_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Normal"], HashMap::from([("Normal", 0.9), ("Baja", 0.05), ("Alta", 0.05)])),
          (vec!["Fuga"], HashMap::from([("Baja", 0.6), ("Normal", 0.3), ("Alta", 0.1)])),
          (vec!["FallaMecanica"], HashMap::from([("Alta", 0.7), ("Normal", 0.2), ("Baja", 0.1)])),
     ]);
     bn.add_discrete_node("PresionReal", vec!["EstadoOperativo"], vec!["Baja","Normal","Alta"], presion_real_cpt)?;

     // --- 3. ProduccionGasReal ---
     let prod_gas_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Bueno","Normal"], HashMap::from([("Normal",0.85),("Alta",0.10),("Baja",0.05)])),
          (vec!["Bueno","Bajo"], HashMap::from([("Normal",0.5),("Alta",0.1),("Baja",0.4)])),
          (vec!["Degradado","Normal"], HashMap::from([("Normal",0.2),("Alta",0.1),("Baja",0.7)])),
          (vec!["Degradado","Bajo"], HashMap::from([("Normal",0.09),("Alta",0.01),("Baja",0.9)])),
          (vec!["Bueno","Alto"], HashMap::from([("Normal",0.7),("Alta",0.25),("Baja",0.05)])),
          (vec!["Degradado","Alto"], HashMap::from([("Normal",0.1),("Alta",0.2),("Baja",0.7)])),
     ]);
     bn.add_discrete_node("ProduccionGasReal", vec!["EstadoMicrobiano","CaudalReal"], vec!["Baja","Normal","Alta"], prod_gas_cpt)?;

     // --- 4. Nodos sensores ---
     let t_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Alta"], HashMap::from([("alta",0.92),("normal",0.07),("baja",0.01)])),
          (vec!["Normal"], HashMap::from([("normal",0.9),("baja",0.05),("alta",0.05)])),
          (vec!["Baja"], HashMap::from([("baja",0.95),("normal",0.04),("alta",0.01)])),
     ]);
     bn.add_discrete_node("T_sensor", vec!["TemperaturaReal"], vec!["baja","normal","alta"], t_sensor_cpt)?;

     let ph_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Neutro"], HashMap::from([("neutro",0.9),("acido",0.05),("alcalino",0.05)])),
          (vec!["Acido"], HashMap::from([("acido",0.9),("neutro",0.05),("alcalino",0.05)])),
          (vec!["Alcalino"], HashMap::from([("alcalino",0.9),("neutro",0.05),("acido",0.05)])),
     ]);
     bn.add_discrete_node("pH_sensor", vec!["pHReal"], vec!["acido","neutro","alcalino"], ph_sensor_cpt)?;

     let flow_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Bajo"], HashMap::from([("bajo",0.95),("normal",0.04),("alto",0.01)])),
          (vec!["Normal"], HashMap::from([("normal",0.9),("bajo",0.05),("alto",0.05)])),
          (vec!["Alto"], HashMap::from([("alto",0.92),("normal",0.06),("bajo",0.02)])),
     ]);
     bn.add_discrete_node("Flow_sensor", vec!["CaudalReal"], vec!["bajo","normal","alto"], flow_sensor_cpt)?;

     let gas_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Baja"], HashMap::from([("bajo",0.95),("normal",0.04),("alto",0.01)])),
          (vec!["Normal"], HashMap::from([("normal",0.9),("bajo",0.05),("alto",0.05)])),
          (vec!["Alta"], HashMap::from([("alto",0.92),("normal",0.06),("bajo",0.02)])),
     ]);
     bn.add_discrete_node("Gas_sensor", vec!["ProduccionGasReal"], vec!["bajo","normal","alto"], gas_sensor_cpt)?;

     let presion_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
          (vec!["Alta"], HashMap::from([("alta",0.92),("normal",0.06),("baja",0.02)])),
          (vec!["Normal"], HashMap::from([("normal",0.9),("baja",0.05),("alta",0.05)])),
          (vec!["Baja"], HashMap::from([("baja",0.95),("normal",0.04),("alta",0.01)])),
     ]);
     bn.add_discrete_node("Presion_sensor", vec!["PresionReal"], vec!["baja","normal","alta"], presion_sensor_cpt)?;

     Ok(bn)
}


#[cfg(test)]
mod tests {
     use std::collections::HashMap;
     use serde_json::{self, Value};
     use suma_core::core::probability::bayes::BN_base::{BayesianNetworkBase, State};
     const TOLERANCE: f64 = 1e-6;

     use super::*;

     #[test]
     fn test_build_network() {
          let bn_result = build_network_internal();
          assert!(bn_result.is_ok(), "Failed to build Bayesian Network: {:?}", bn_result.err());
          let bn = bn_result.unwrap();
          // La red tiene 12 nodos
          assert_eq!(bn.get_nodes().len(), 12, "Network should have 12 nodes");
     }

     #[test]
     fn test_complex_inference_high_samples() {
          let bn = build_network_internal().expect("Failed to build Bayesian Network");

          // Escenario: Todos los sensores 'normal' o 'neutro'
          let mut evidence: HashMap<usize, State> = HashMap::new();
          
          let t_sensor_id = bn.get_id_from_name("T_sensor").expect("Node T_sensor not found");
          evidence.insert(t_sensor_id, State::Value("normal".to_string()));

          let ph_sensor_id = bn.get_id_from_name("pH_sensor").expect("Node pH_sensor not found");
          evidence.insert(ph_sensor_id, State::Value("neutro".to_string()));

          let flow_sensor_id = bn.get_id_from_name("Flow_sensor").expect("Node Flow_sensor not found");
          evidence.insert(flow_sensor_id, State::Value("normal".to_string()));
        
        let gas_sensor_id = bn.get_id_from_name("Gas_sensor").expect("Node Gas_sensor not found");
          evidence.insert(gas_sensor_id, State::Value("normal".to_string()));

        let presion_sensor_id = bn.get_id_from_name("Presion_sensor").expect("Node Presion_sensor not found");
          evidence.insert(presion_sensor_id, State::Value("normal".to_string()));


          let target_id = bn.get_id_from_name("EstadoMicrobiano").expect("Node EstadoMicrobiano not found");

          // Usamos 100,000 muestras
          let distribution = bn.likelihood_weighting_sampling(&evidence, target_id, 100_000);

          assert!(!distribution.is_empty(), "Inferencia compleja falló. Evidencia imposible de muestrear (La lógica de rechazo en suma_core puede ser la culpable).");
        
          let sum_probabilities: f64 = distribution.values().sum();
          assert!((sum_probabilities - 1.0).abs() < 0.05, "Probabilidades no suman a 1.0. Suma: {}", sum_probabilities);
          
          println!("Inferencia con 100,000 muestras (EstadoMicrobiano | Sensores Normales): {:?}", distribution);
     }
    
     #[test]
     fn test_critical_single_evidence() {
          let bn = build_network_internal().expect("Failed to build Bayesian Network");

          let mut evidence: HashMap<usize, State> = HashMap::new();
          let ph_sensor_id = bn.get_id_from_name("pH_sensor").expect("Node pH_sensor not found");
          evidence.insert(ph_sensor_id, State::Value("neutro".to_string())); 

          let target_id = bn.get_id_from_name("EstadoMicrobiano").expect("Node EstadoMicrobiano not found");
          let distribution = bn.likelihood_weighting_sampling(&evidence, target_id, 10_000);

          assert!(!distribution.is_empty(), "FALLO CRÍTICO: Inferencia simple devuelve distribución vacía. La lógica de rechazo está rota.");
          
          let sum_probabilities: f64 = distribution.values().sum();
          assert!((sum_probabilities - 1.0).abs() < 0.05, "Probabilidades no suman a 1.0 en test simple. Suma: {}", sum_probabilities);

          let prob_bueno = distribution.get(&State::Value("Bueno".to_string())).copied().unwrap_or(0.0);
          let prob_degradado = distribution.get(&State::Value("Degradado".to_string())).copied().unwrap_or(0.0);

          println!("Inferencia con 10,000 muestras (EstadoMicrobiano | pH Neutro): {:?}", distribution);
          assert!(prob_bueno > prob_degradado, "La probabilidad de 'Bueno' debería ser mayor que la de 'Degradado' dada la evidencia 'Neutro'.");
     }

    // NUEVO TEST DE SANIDAD: Verifica si la evidencia se puede aplicar a un nodo raíz (el caso más fácil)
    #[test]
    fn test_sanidad_evidencia_raiz() {
        let bn = build_network_internal().expect("Failed to build Bayesian Network");

        let mut evidence: HashMap<usize, State> = HashMap::new();
        let target_id = bn.get_id_from_name("EstadoOperativo").expect("Node EstadoOperativo not found");
        
        // Evidencia aplicada directamente a un nodo raíz
        evidence.insert(target_id, State::Value("Fuga".to_string())); 

        // Query el nodo "PresionReal" (hijo del nodo raíz con evidencia)
        let query_id = bn.get_id_from_name("PresionReal").expect("Node PresionReal not found");
        let distribution = bn.likelihood_weighting_sampling(&evidence, query_id, 1000);

        assert!(!distribution.is_empty(), "FALLO DE SANIDAD: La inferencia con evidencia en un nodo raíz devuelve distribución vacía. ERROR SEVERO EN LOGICA DE MUESTREO.");
        
        let sum_probabilities: f64 = distribution.values().sum();
        assert!((sum_probabilities - 1.0).abs() < 0.05, "Probabilidades no suman a 1.0. Suma: {}", sum_probabilities);
        
        // Bajo Fuga, PresionReal debería ser 'Baja' (0.6) o 'Normal' (0.3)
        let prob_baja = distribution.get(&State::Value("Baja".to_string())).copied().unwrap_or(0.0);
        println!("Inferencia con 1000 muestras (PresionReal | EstadoOperativo Fuga): {:?}", distribution);

        assert!(prob_baja > 0.5, "Bajo 'Fuga', PresionReal debe tener una alta probabilidad de ser 'Baja'. Prob Baja: {}", prob_baja);
    }

    #[test]
    fn debug_cpt_structure_and_data() {
        // 1. Construir la red
        let bn = build_network_internal().expect("Failed to build Bayesian Network");
        println!("\n🔍 INICIANDO INSPECCIÓN DE CPTs 🔍");
        println!("========================================");

        let mut found_empty_tables = false;

        for node_id in bn.get_nodes() {
            let node_name = bn.get_name_from_id(node_id).map_or("Unknown", |v| v);
            
            // 2. Obtener la CPT
            let cpt = bn.get_node_cpt_by_id(&node_id);
            
            // 3. Serializar a Value para poder navegar el JSON en el test
            let json_value = serde_json::to_value(&cpt).expect("Failed to serialize to Value");
            
            println!("\n📍 Nodo: {} (ID: {})", node_name, node_id);
            
            // 4. Analizar si es Discrete o Binary y buscar la tabla
            if let Some(discrete) = json_value.get("Discrete") {
                check_table_content("Discrete", discrete, node_name, &mut found_empty_tables);
            } else if let Some(binary) = json_value.get("Binary") {
                check_table_content("Binary", binary, node_name, &mut found_empty_tables);
            } else {
                println!("   ⚠️  Formato desconocido (ni Discrete ni Binary): {:?}", json_value);
            }
        }

        println!("\n========================================");
        if found_empty_tables {
            panic!("❌ SE ENCONTRARON TABLAS VACÍAS. Revisa los logs de arriba.");
        } else {
            println!("✅ Todas las tablas tienen datos.");
        }
    }

    // Función auxiliar para revisar el contenido de la tabla
    fn check_table_content(tipo: &str, data: &Value, node_name: &str, found_empty: &mut bool) {
        // Verificar estados posibles
        if let Some(values) = data.get("node_possible_values") {
            let count = values.as_array().map(|v| v.len()).unwrap_or(0);
            println!("   🔹 Tipo: {} | Estados definidos: {}", tipo, count);
        }

        // Verificar la tabla
        if let Some(table) = data.get("table") {
            if let Some(table_map) = table.as_object() {
                if table_map.is_empty() {
                    println!("   ❌ ERROR: El campo 'table' está VACÍO {{}}");
                    println!("      Esto es lo que envía Rust: {}", serde_json::to_string(data).unwrap());
                    *found_empty = true;
                } else {
                    println!("   ✅ OK: La tabla tiene {} entradas.", table_map.len());
                    // Opcional: Imprimir una entrada para ver el formato de la key
                    let first_key = table_map.keys().next().unwrap();
                    println!("      Ejemplo de key: {:?}", first_key);
                }
            } else {
                println!("   ❌ ERROR: 'table' no es un objeto JSON.");
            }
        } else {
            println!("   ❌ ERROR: No existe el campo 'table'.");
            *found_empty = true;
        }
    }
}