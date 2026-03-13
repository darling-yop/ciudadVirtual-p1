/**
 * EdificioFactory.js
 * Fábrica para crear instancias de edificios según el tipo.
 * Facilita la construcción y reconstrucción desde el estado serializado.
 */

import { Edificio } from './Edificio.js';
import { EdificioComercial } from './Edificio_comercial.js';
import { EdificioIndustrial } from './Edificio_industrial.js';
import { EdificioResidencial } from './Edificio_residencial.js';
import { EdificioServicios } from './Edificio_servicios.js';
import { EdificioUtilidades } from './Edificio_utilidades.js';

const configuraciones = {
    // Residenciales
    R1: {
        costo: 2500,
        consumoElectricidad: 4,
        consumoAgua: 4,
        ingreso: 20,
        capacidad: 20,
        mantenimiento: 10
    },
    R2: {
        costo: 4500,
        consumoElectricidad: 6,
        consumoAgua: 6,
        ingreso: 35,
        capacidad: 40,
        mantenimiento: 18
    },

    // Comerciales
    C1: {
        costo: 4000,
        consumoElectricidad: 8,
        consumoAgua: 5,
        ingreso: 120,
        capacidad: 15,
        mantenimiento: 20
    },
    C2: {
        costo: 8500,
        consumoElectricidad: 12,
        consumoAgua: 8,
        ingreso: 240,
        capacidad: 30,
        mantenimiento: 35
    },

    // Industriales
    I1: {
        costo: 7000,
        consumoElectricidad: 12,
        consumoAgua: 8,
        produccion: 25,
        capacidad: 25,
        mantenimiento: 30,
        recurso: 'comida',
        tasaProduccion: 1.2
    },
    I2: {
        costo: 13000,
        consumoElectricidad: 18,
        consumoAgua: 10,
        produccion: 45,
        capacidad: 45,
        mantenimiento: 50,
        recurso: 'comida',
        tasaProduccion: 1.4
    },

    // Servicios
    S1: {
        costo: 3000,
        consumoElectricidad: 5,
        consumoAgua: 3,
        capacidad: 20,
        beneficio: 10,
        mantenimiento: 15,
        servicio: 'salud'
    },
    S2: {
        costo: 3000,
        consumoElectricidad: 5,
        consumoAgua: 3,
        capacidad: 20,
        beneficio: 10,
        mantenimiento: 15,
        servicio: 'seguridad'
    },
    S3: {
        costo: 3000,
        consumoElectricidad: 5,
        consumoAgua: 3,
        capacidad: 20,
        beneficio: 10,
        mantenimiento: 15,
        servicio: 'educación'
    },

    // Utilidades
    U1: {
        costo: 12000,
        consumoElectricidad: 0,
        consumoAgua: 0,
        produccion: 60,
        capacidad: 30,
        mantenimiento: 25,
        utilidad: 'electricidad',
        reservaInicial: 0,
        almacenamiento: 500
    },
    U2: {
        costo: 12000,
        consumoElectricidad: 0,
        consumoAgua: 0,
        produccion: 60,
        capacidad: 30,
        mantenimiento: 25,
        utilidad: 'agua',
        reservaInicial: 0,
        almacenamiento: 500
    },

    // Parques
    P1: {
        costo: 5000,
        consumoElectricidad: 1,
        consumoAgua: 1,
        capacidad: 0,
        beneficio: 20,
        mantenimiento: 5
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
            return new Edificio(uniqueId, tipo, x, y, stats);
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
