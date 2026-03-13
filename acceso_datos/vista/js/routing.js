/**
 * Módulo de routing que integra con el backend Python para calcular rutas.
 * Reemplaza el algoritmo Dijkstra local con llamadas a la API REST.
 */

/**
 * Calcula una ruta entre dos puntos usando el backend Python.
 * @param {Mapa} mapa - Instancia de la clase Mapa
 * @param {number} ox - Coordenada X de origen
 * @param {number} oy - Coordenada Y de origen
 * @param {number} dx - Coordenada X de destino
 * @param {number} dy - Coordenada Y de destino
 * @returns {Promise<Array>} Array de objetos {x, y} representando la ruta, o null si no hay ruta
 */
export async function callRouteAPI(mapa, ox, oy, dx, dy) {
    try {
        // Construir matriz: 1=vía (transitable), 0=edificio (bloqueado)
        const map = [];
        for (let row = 0; row < mapa.alto; row++) {
            const r = [];
            for (let col = 0; col < mapa.ancho; col++) {
                r.push(mapa.grid[row][col] === 'r' ? 1 : 0);
            }
            map.push(r);
        }

        const response = await fetch('http://127.0.0.1:5000/api/calculate-route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                map: map,
                start: [oy, ox],  // [fila, columna] → invertir x,y
                end: [dy, dx]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
        }

        // data.route = [[fila,col], [fila,col], ...]
        // Convertir de vuelta a {x, y}
        return data.route.map(([row, col]) => ({ x: col, y: row }));
    } catch (error) {
        console.error('Error calculando ruta:', error);
        return null;  // Retornar null si hay error
    }
}

/**
 * Función auxiliar para verificar si el backend está disponible.
 * @returns {Promise<boolean>} true si el backend responde, false en caso contrario
 */
export async function checkBackendHealth() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/calculate-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                map: [[1, 1], [1, 1]],
                start: [0, 0],
                end: [1, 1]
            })
        });
        return response.ok;
    } catch {
        return false;
    }
}