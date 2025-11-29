use std::collections::HashMap;
use suma_core::core::probability::bayes::BayesianNetwork;

// Construcción completa del biodigestor
pub fn build_biodigester_network() -> Result<BayesianNetwork, String> {
    let mut bn = BayesianNetwork::new();

    // --- 1. Nodos raíz (sin padres) ---

    // EstadoMicrobiano: {Bueno, Degradado} -> binario
    let microbiano_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec![], HashMap::from([
            ("Bueno", 0.85),
            ("Degradado", 0.15),
        ])),
    ]);
    bn.add_discrete_node("EstadoMicrobiano", vec![], vec!["Bueno", "Degradado"], microbiano_cpt)?;

    // EstadoOperativo: {Normal, FallaMecanica, Fuga}
    let operativo_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec![], HashMap::from([
            ("Normal", 0.95),
            ("FallaMecanica", 0.03),
            ("Fuga", 0.02),
        ])),
    ]);
    bn.add_discrete_node("EstadoOperativo", vec![], vec!["Normal", "FallaMecanica", "Fuga"], operativo_cpt)?;

    // --- 2. Nodos físicos/intermedios ---

    // TemperaturaReal depende de EstadoMicrobiano
    let temp_real_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec!["Bueno"], HashMap::from([("Normal", 0.9), ("Baja", 0.05), ("Alta", 0.05)])),
        (vec!["Degradado"], HashMap::from([("Baja", 0.6), ("Normal", 0.3), ("Alta", 0.1)])),
    ]);
    bn.add_discrete_node("TemperaturaReal", vec!["EstadoMicrobiano"], vec!["Baja","Normal","Alta"], temp_real_cpt)?;

    // pHReal depende de EstadoMicrobiano
    let ph_real_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec!["Bueno"], HashMap::from([("Neutro", 0.85), ("Acido", 0.1), ("Alcalino", 0.05)])),
        (vec!["Degradado"], HashMap::from([("Acido", 0.6), ("Neutro", 0.3), ("Alcalino", 0.1)])),
    ]);
    bn.add_discrete_node("pHReal", vec!["EstadoMicrobiano"], vec!["Acido","Neutro","Alcalino"], ph_real_cpt)?;

    // CaudalReal depende de EstadoOperativo
    let caudal_real_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec!["Normal"], HashMap::from([("Normal", 0.9), ("Bajo", 0.05), ("Alto", 0.05)])),
        (vec!["Fuga"], HashMap::from([("Alto", 0.7), ("Normal", 0.2), ("Bajo", 0.1)])),
        (vec!["FallaMecanica"], HashMap::from([("Bajo", 0.8), ("Normal", 0.15), ("Alto", 0.05)])),
    ]);
    bn.add_discrete_node("CaudalReal", vec!["EstadoOperativo"], vec!["Bajo","Normal","Alto"], caudal_real_cpt)?;

    // PresionReal depende de EstadoOperativo
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
    bn.add_discrete_node(
        "ProduccionGasReal",
        vec!["EstadoMicrobiano","CaudalReal"],
        vec!["Baja","Normal","Alta"],
        prod_gas_cpt,
    )?;

    // --- 4. Nodos sensores ---
    // T_sensor depende de TemperaturaReal
    let t_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec!["Alta"], HashMap::from([("alta",0.92),("normal",0.07),("baja",0.01)])),
        (vec!["Normal"], HashMap::from([("normal",0.9),("baja",0.05),("alta",0.05)])),
        (vec!["Baja"], HashMap::from([("baja",0.95),("normal",0.04),("alta",0.01)])),
    ]);
    bn.add_discrete_node("T_sensor", vec!["TemperaturaReal"], vec!["baja","normal","alta"], t_sensor_cpt)?;

    // pH_sensor depende de pHReal
    let ph_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec!["Neutro"], HashMap::from([("neutro",0.9),("acido",0.05),("alcalino",0.05)])),
        (vec!["Acido"], HashMap::from([("acido",0.9),("neutro",0.05),("alcalino",0.05)])),
        (vec!["Alcalino"], HashMap::from([("alcalino",0.9),("neutro",0.05),("acido",0.05)])),
    ]);
    bn.add_discrete_node("pH_sensor", vec!["pHReal"], vec!["acido","neutro","alcalino"], ph_sensor_cpt)?;

    // Flow_sensor depende de CaudalReal
    let flow_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec!["Bajo"], HashMap::from([("bajo",0.95),("normal",0.04),("alto",0.01)])),
        (vec!["Normal"], HashMap::from([("normal",0.9),("bajo",0.05),("alto",0.05)])),
        (vec!["Alto"], HashMap::from([("alto",0.92),("normal",0.06),("bajo",0.02)])),
    ]);
    bn.add_discrete_node("Flow_sensor", vec!["CaudalReal"], vec!["bajo","normal","alto"], flow_sensor_cpt)?;

    // Gas_sensor depende de ProduccionGasReal
    let gas_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec!["Baja"], HashMap::from([("bajo",0.95),("normal",0.04),("alto",0.01)])),
        (vec!["Normal"], HashMap::from([("normal",0.9),("bajo",0.05),("alto",0.05)])),
        (vec!["Alta"], HashMap::from([("alto",0.92),("normal",0.06),("bajo",0.02)])),
    ]);
    bn.add_discrete_node("Gas_sensor", vec!["ProduccionGasReal"], vec!["bajo","normal","alto"], gas_sensor_cpt)?;

    // Presion_sensor depende de PresionReal
    let presion_sensor_cpt: HashMap<Vec<&str>, HashMap<&str, f64>> = HashMap::from([
        (vec!["Alta"], HashMap::from([("alta",0.92),("normal",0.06),("baja",0.02)])),
        (vec!["Normal"], HashMap::from([("normal",0.9),("baja",0.05),("alta",0.05)])),
        (vec!["Baja"], HashMap::from([("baja",0.95),("normal",0.04),("alta",0.01)])),
    ]);
    bn.add_discrete_node("Presion_sensor", vec!["PresionReal"], vec!["baja","normal","alta"], presion_sensor_cpt)?;

    Ok(bn)
}