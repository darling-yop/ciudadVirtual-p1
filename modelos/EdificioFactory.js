/**
 * EdificioFactory.js
 * Fábrica para crear instancias de edificios según el tipo.
 * Facilita la construcción y reconstrucción desde el estado serializado.
 */

import { EdificioComercial } from './Edificio_comercial.js';
import { EdificioIndustrial } from './Edificio_industrial.js';
import { EdificioParques } from './Edificio_parques.js';
import { EdificioResidencial } from './Edificio_residencial.js';
import { EdificioServicios } from './Edificio_servicios.js';
import { EdificioUtilidades } from './Edificio_utilidades.js';

const configuraciones = {
    // Residenciales
    R1: {
        costo: 1000,
        consumoElectricidad: 5,
        consumoAgua: 3,
        ingreso: 0,
        capacidad: 4,
        mantenimiento: 10
    },
    R2: {
        costo: 3000,
        consumoElectricidad: 15,
        consumoAgua: 10,
        ingreso: 0,
        capacidad: 12,
        mantenimiento: 18
    },

    // Comerciales
    C1: {
        costo: 2000,
        consumoElectricidad: 8,
        consumoAgua: 0,
        ingreso: 500,
        capacidad: 6,
        mantenimiento: 20
    },
    C2: {
        costo: 8000,
        consumoElectricidad: 25,
        consumoAgua: 0,
        ingreso: 2000,
        capacidad: 20,
        mantenimiento: 35
    },

    // Industriales
    I1: {
        costo: 5000,
        consumoElectricidad: 20,
        consumoAgua: 15,
        produccion: 800,
        capacidad: 15,
        mantenimiento: 30,
        recurso: 'dinero',
        tasaProduccion: 1
    },
    I2: {
        costo: 3000,
        consumoElectricidad: 0,
        consumoAgua: 10,
        produccion: 50,
        capacidad: 8,
        mantenimiento: 50,
        recurso: 'comida',
        tasaProduccion: 1
    },

    // Servicios
    S1: {
        costo: 4000,
        consumoElectricidad: 15,
        consumoAgua: 0,
        capacidad: 4,
        beneficio: 10,
        mantenimiento: 15,
        servicio: 'policía',
        radio: 5
    },
    S2: {
        costo: 4000,
        consumoElectricidad: 15,
        consumoAgua: 0,
        capacidad: 8,
        beneficio: 10,
        mantenimiento: 15,
        servicio: 'bomberos',
        radio: 5
    },
    S3: {
        costo: 6000,
        consumoElectricidad: 20,
        consumoAgua: 10,
        capacidad: 12,
        beneficio: 10,
        mantenimiento: 15,
        servicio: 'hospital',
        radio: 7
    },

    // Utilidades
    U1: {
        costo: 10000,
        consumoElectricidad: 0,
        consumoAgua: 0,
        produccion: 200,
        capacidad: 0,
        mantenimiento: 25,
        utilidad: 'electricidad'
    },
    U2: {
        costo: 8000,
        consumoElectricidad: 20,
        consumoAgua: 0,
        produccion: 150,
        capacidad: 0,
        mantenimiento: 25,
        utilidad: 'agua'
    },

    // Parques
    P1: {
        costo: 1500,
        consumoElectricidad: 0,
        consumoAgua: 0,
        capacidad: 0,
        beneficio: 5,
        mantenimiento: 5,
        tipoRecreacion: 'parque'
    }
};

export function crearEdificioDesdeTipo(tipo, x, y, id = null) {
    if (!configuraciones[tipo]) return null;

    const stats = configuraciones[tipo];
    const uniqueId = id || `${tipo}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    switch (tipo) {
        case 'R1':
        case 'R2':
            return new EdificioResidencial(uniqueId, tipo, x, y, stats);
        case 'C1':
        case 'C2':
            return new EdificioComercial(uniqueId, tipo, x, y, stats);
        case 'I1':
        case 'I2':
            return new EdificioIndustrial(uniqueId, tipo, x, y, stats);
        case 'S1':
        case 'S2':
        case 'S3':
            return new EdificioServicios(uniqueId, tipo, x, y, stats);
        case 'U1':
        case 'U2':
            return new EdificioUtilidades(uniqueId, tipo, x, y, stats);
        case 'P1':
            return new EdificioParques(uniqueId, tipo, x, y, stats);
        default:
            return null;
    }
}

export function reconstruirEdificioDesdeEstado(estado) {
    if (!estado || !estado.tipo) return null;
    const edificio = crearEdificioDesdeTipo(estado.tipo, estado.ubicacion?.x ?? 0, estado.ubicacion?.y ?? 0, estado.id);
    if (!edificio) return null;

    edificio.ocupacionActual = estado.ocupacionActual || 0;
    edificio.estaOperativo = estado.estaOperativo !== undefined ? estado.estaOperativo : true;

    if (estado.ciudadanosAsignados) edificio.ciudadanosAsignados = [...estado.ciudadanosAsignados];
    if (estado.empleadosAsignados) edificio.empleadosAsignados = [...estado.empleadosAsignados];
    if (estado.ciudadanosAtendidos) edificio.ciudadanosAtendidos = [...estado.ciudadanosAtendidos];

    return edificio;
}
