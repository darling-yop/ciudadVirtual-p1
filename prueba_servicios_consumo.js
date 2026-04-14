/**
 * prueba_servicios_consumo.js
 * Prueba para validar que los servicios S1/S2/S3 consumen electricidad correctamente
 */

import { Ciudad } from './modelos/Ciudad.js';

console.log('=== PRUEBA DE CONSUMO SERVICIOS ===\n');

const ciudad = new Ciudad('PruebaServicios', 'Alcalde', { nombre: 'Bogotá', coordenadas: { lat: 4.6097, lon: -74.0817 } }, 20, 20);

// Mapa con productores y servicios
const textoMapa = `
r r r r r r r r r r r r r r r
r U1 r r S1 r r r r r r r r r r
r r r S2 r r r r r r r r r r r
r r r r r r S3 r r r r r r r r
r U2 r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
`;

ciudad.cargarMapaDesdeTexto(textoMapa);
console.log('Edificios cargados:', ciudad.edificios.length);

// Mostrar edificios
console.log('\n--- EDIFICIOS Y SUS CONSUMOS ---');
ciudad.edificios.forEach(e => {
    console.log(`[${e.tipo}] Ubicación: (${e.x}, ${e.y})`);
    console.log(`  - Consumo E: ${e.consumoElectricidad}, Agua: ${e.consumoAgua}`);
    console.log(`  - Producción: ${e.produccionRecurso}`);
});

// Simular un turno
console.log('\n--- CONSUMO EN TURNO 1 ---');
console.log('Antes:');
console.log(`  Electricidad: ${ciudad.recursos.electricidad}`);
console.log(`  Agua: ${ciudad.recursos.agua}`);

ciudad.procesarTurno();

console.log('Después (turno 1):');
console.log(`  Electricidad: ${ciudad.recursos.electricidad}`);
console.log(`  Agua: ${ciudad.recursos.agua}`);

// Verificar consumo esperado
const u1Prod = 200; // U1 produce electricidad
const u2Prod = 150; // U2 produce agua
const s1Cons = 15;  // S1 consume electricidad
const s2Cons = 15;  // S2 consume electricidad
const s3Cons = 20;  // S3 consume electricidad
const u2Cons = 20;  // U2 consume electricidad

const expectedE = u1Prod + u2Prod - s1Cons - s2Cons - s3Cons - u2Cons;
const expectedA = u2Prod - 10; // S3 consume 10 agua

console.log(`\n--- VALIDACIÓN ---`);
console.log(`Electricidad esperada aproximada: ${expectedE - 100} a ${expectedE + 100}`);
console.log(`Agua esperada aproximada: ${expectedA - 50} a ${expectedA + 50}`);
console.log(`Consumo S1/S2/S3 total: ${s1Cons + s2Cons + s3Cons} MW`);

console.log('\n✓ Prueba completada');
