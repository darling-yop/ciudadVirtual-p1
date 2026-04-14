/**
 * prueba_simulacion.js
 * Script de prueba para validar que los valores oficiales se aplican correctamente
 * en la simulación: producción, consumo, costos y finalización inmediata.
 */

import { Ciudad } from './modelos/Ciudad.js';

console.log('=== PRUEBA DE SIMULACIÓN ===\n');

// Crear ciudad
const ciudad = new Ciudad(
    'TestCity',
    'Alcalde Test',
    { nombre: 'Bogotá', coordenadas: { lat: 4.6097, lon: -74.0817 } },
    20,
    20
);

console.log('✓ Ciudad creada:', ciudad.nombre);
console.log('  - Dinero inicial:', ciudad.recursos.dinero);
console.log('  - Electricidad inicial:', ciudad.recursos.electricidad);
console.log('  - Agua inicial:', ciudad.recursos.agua);
console.log('  - Alimentos inicial:', ciudad.recursos.alimentos);

// Mapa simple: 1 R1, 1 U1, 1 U2, 1 I2, 1 C1
const textoMapa = `
r r r r r r r r r r r r r r r
r R1 r r U1 r r r r r r r r r r
r r r C1 r r r r r r r r r r r
r r r r r r r U2 r r r r r r r
r r I2 r r r r r r r r r r r r
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

const resultadoMapa = ciudad.cargarMapaDesdeTexto(textoMapa);
console.log('\n✓ Mapa cargado:', resultadoMapa.exito);
console.log('  - Dimensiones:', resultadoMapa.ancho, 'x', resultadoMapa.alto);
console.log('  - Edificios:', ciudad.edificios.length);
console.log('  - Dinero tras construcción:', ciudad.recursos.dinero);

// Mostrar edificios
console.log('\n--- EDIFICIOS CONSTRUIDOS ---');
ciudad.edificios.forEach(e => {
    console.log(`[${e.tipo}] Ubicación: (${e.x}, ${e.y}) | Costo: ${e.costoConstruccion}`);
    console.log(`       Consumo E: ${e.consumoElectricidad}, Agua: ${e.consumoAgua}`);
    console.log(`       Producción: ${e.produccionRecurso}, Ingreso: ${e.ingresoPorTurno}`);
});

// Procesar algunos turnos
console.log('\n--- SIMULACIÓN DE TURNOS ---');
for (let i = 0; i < 5; i++) {
    console.log(`\nTurno ${ciudad.turnoActual + 1}:`);
    
    ciudad.procesarTurno();
    
    console.log(`  Dinero: ${ciudad.recursos.dinero}`);
    console.log(`  Electricidad: ${ciudad.recursos.electricidad}`);
    console.log(`  Agua: ${ciudad.recursos.agua}`);
    console.log(`  Alimentos: ${ciudad.recursos.alimentos}`);
    console.log(`  Juego finalizado: ${ciudad.juegoFinalizado}`);
    
    if (ciudad.juegoFinalizado) {
        console.log(`  MOTIVO: ${ciudad.motivoFinJuego}`);
        break;
    }
}

console.log('\n=== FIN DE PRUEBA ===');
