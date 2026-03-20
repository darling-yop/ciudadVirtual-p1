/**
 * RouteRepository.js
 * Cliente HTTP para calcular rutas usando el backend de Dijkstra del profesor.
 */

const ROUTING_API_URL = (typeof window !== 'undefined' && window.ROUTING_API_URL)
    ? window.ROUTING_API_URL
    : 'http://127.0.0.1:5000/api/calculate-route';

function mapToBinaryGrid(grid) {
    return grid.map((row) => row.map((cell) => (cell === 'r' ? 1 : 0)));
}

function toBackendCoord(point) {
    return [point.y, point.x];
}

function toFrontendCoord(point) {
    return { x: point[1], y: point[0] };
}

export const RouteRepository = {
    async calculateRoute(mapGrid, startPoint, endPoint) {
        if (!Array.isArray(mapGrid) || mapGrid.length === 0) {
            return { exito: false, error: 'Mapa invalido para calcular ruta.' };
        }

        const payload = {
            map: mapToBinaryGrid(mapGrid),
            start: toBackendCoord(startPoint),
            end: toBackendCoord(endPoint)
        };

        try {
            const response = await fetch(ROUTING_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                return {
                    exito: false,
                    error: data.error || 'No fue posible calcular la ruta en el backend.'
                };
            }

            const backendRoute = Array.isArray(data.route) ? data.route : [];
            if (backendRoute.length === 0) {
                return { exito: false, error: 'El backend no retorno una ruta valida.' };
            }

            return {
                exito: true,
                ruta: backendRoute.map(toFrontendCoord)
            };
        } catch (error) {
            return {
                exito: false,
                error: 'No se pudo conectar con el backend de rutas. Verifica que este corriendo en http://127.0.0.1:5000.'
            };
        }
    }
};
