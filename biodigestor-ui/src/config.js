import {
  FaThermometerHalf,
  FaFlask,
  FaFire,
  FaTint,
  FaTachometerAlt,
  FaBacteria,
  FaToolbox
} from 'react-icons/fa';

// Configuración de la UI
export const SENSORES = [
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

export const OBJETIVOS = [
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