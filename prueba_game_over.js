/**
 * prueba_game_over.js
 * Prueba de finalización inmediata por déficit de recursos
 */

import { Ciudad } from './modelos/Ciudad.js';

console.log('=== PRUEBA DE GAME OVER INMEDIATO ===\n');

const ciudad = new Ciudad('GameOverTest', 'Alcalde', { nombre: 'Bogotá', coordenadas: { lat: 4.6097, lon: -74.0817 } }, 20, 20);

// Mapa con solo consumidores, sin productores
const textoMapa = `
r r r r r r r r r r r r r r r
r R1 r r r r r r r r r r r r r
r r r C1 r r r r r r r r r r r
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
r r r r r r r r r r r r r r r
r r r r r r r r r r r r r r r
`;

ciudad.cargarMapaDesdeTexto(textoMapa);
console.log('Estado inicial:');
console.log('  Electricidad:', ciudad.recursos.electricidad);
console.log('  Agua:', ciudad.recursos.agua);
console.log('  Dinero:', ciudad.recursos.dinero);

console.log('\nProcesando turnos...');
for (let i = 0; i < 3; i++) {
    console.log(`\nTurno ${ciudad.turnoActual + 1}:`);
    ciudad.procesarTurno();
    
    console.log(`  E: ${ciudad.recursos.electricidad}, A: ${ciudad.recursos.agua}`);
    console.log(`  Finalizado: ${ciudad.juegoFinalizado}`);
    
    if (ciudad.juegoFinalizado) {
        console.log(`  🛑 MOTIVO: ${ciudad.motivoFinJuego}`);
        break;
    }
}

console.log('\n=== FIN ===');
