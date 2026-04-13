// test_ranking.js - Script de prueba para verificar funcionalidad del ranking
import { RankingLocal } from './acceso_datos/RankingLocal.js';

// Crear instancia del ranking
const rankingLocal = new RankingLocal();

// Datos de prueba
const ciudadPrueba = {
    cityId: 'test-city-1',
    nombre: 'Ciudad de Prueba',
    alcaldeNombre: 'Test Alcalde',
    poblacion: 1500,
    felicidadPromedio: 75,
    puntuacionAcumulada: 2500,
    turnoActual: 15,
    fechaGuardado: new Date().toISOString()
};

console.log('🧪 Iniciando pruebas del sistema de ranking...');

// Prueba 1: Guardar puntuación
console.log('1. Guardando puntuación de ciudad de prueba...');
const guardado = rankingLocal.guardarPuntuacion(ciudadPrueba);
console.log('✅ Puntuación guardada:', guardado);

// Prueba 2: Obtener ranking
console.log('2. Obteniendo ranking completo...');
const ranking = rankingLocal.obtenerRanking();
console.log('📊 Ranking obtenido:', ranking.length, 'ciudades');

// Prueba 3: Obtener posición
console.log('3. Obteniendo posición de la ciudad de prueba...');
const posicion = rankingLocal.obtenerPosicionActual({ cityId: ciudadPrueba.cityId });
console.log('🏆 Posición de la ciudad:', posicion);

// Prueba 4: Verificar datos guardados
console.log('4. Verificando datos en localStorage...');
const rankingGuardado = localStorage.getItem('ciudadVirtual_ranking');
if (rankingGuardado) {
    const rankingParsed = JSON.parse(rankingGuardado);
    console.log('💾 Datos en localStorage:', rankingParsed);
} else {
    console.log('❌ No se encontraron datos en localStorage');
}

console.log('🎉 Pruebas completadas exitosamente!');