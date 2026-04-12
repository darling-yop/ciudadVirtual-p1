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
    // El backend Flask espera coordenadas [fila, columna] => [y, x]
    return [point.y, point.x];
}

function toFrontendCoord(point) {
    // El backend devuelve [[fila, columna], ...] y la vista consume {x, y}
    if (!Array.isArray(point) || point.length < 2) {
        return null;
    }

    return { x: point[1], y: point[0] };
}

function hasAdjacentRoad(binaryGrid, point) {
    const rows = binaryGrid.length;
    const cols = binaryGrid[0].length;
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (const [dy, dx] of dirs) {
        const ny = point.y + dy;
        const nx = point.x + dx;
        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && binaryGrid[ny][nx] === 1) {
            return true;
        }
    }

    return false;
}

function reconstructPath(parents, startKey, endKey) {
    const route = [];
    let current = endKey;

    while (current) {
        const [y, x] = current.split(',').map(Number);
        route.push({ x, y });
        if (current === startKey) break;
        current = parents.get(current);
    }

    route.reverse();
    return route;
}

function calculateRouteLocally(binaryGrid, startPoint, endPoint) {
    const rows = binaryGrid.length;
    const cols = binaryGrid[0].length;

    const inBounds = (x, y) => x >= 0 && x < cols && y >= 0 && y < rows;
    if (!inBounds(startPoint.x, startPoint.y) || !inBounds(endPoint.x, endPoint.y)) {
        return { exito: false, error: 'Coordenadas de origen/destino fuera del mapa.' };
    }

    if (!hasAdjacentRoad(binaryGrid, startPoint) || !hasAdjacentRoad(binaryGrid, endPoint)) {
        return { exito: false, error: 'Edificios no conectados por vías: imposible calcular.' };
    }

    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const startKey = `${startPoint.y},${startPoint.x}`;
    const endKey = `${endPoint.y},${endPoint.x}`;

    const queue = [{ x: startPoint.x, y: startPoint.y }];
    const visited = new Set([startKey]);
    const parents = new Map();

    while (queue.length > 0) {
        const current = queue.shift();
        const currentKey = `${current.y},${current.x}`;

        if (currentKey === endKey) {
            return { exito: true, ruta: reconstructPath(parents, startKey, endKey) };
        }

        for (const [dy, dx] of dirs) {
            const ny = current.y + dy;
            const nx = current.x + dx;
            if (!inBounds(nx, ny)) continue;

            const nextKey = `${ny},${nx}`;
            if (visited.has(nextKey)) continue;

            const isRoad = binaryGrid[ny][nx] === 1;
            const isEnd = nx === endPoint.x && ny === endPoint.y;

            if (!isRoad && !isEnd) continue;

            visited.add(nextKey);
            parents.set(nextKey, currentKey);
            queue.push({ x: nx, y: ny });
        }
    }

    return { exito: false, error: 'Sin ruta disponible: no existe conexión entre las vías.' };
}

export const RouteRepository = {
    async calculateRoute(mapGrid, startPoint, endPoint) {
        if (!Array.isArray(mapGrid) || mapGrid.length === 0) {
            return { exito: false, error: 'Mapa invalido para calcular ruta.' };
        }

        const binaryGrid = mapToBinaryGrid(mapGrid);

        const payload = {
            map: binaryGrid,
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

            const ruta = backendRoute
                .map(toFrontendCoord)
                .filter((point) => point !== null);

            if (ruta.length === 0) {
                return { exito: false, error: 'El backend no retorno coordenadas utilizables.' };
            }

            return {
                exito: true,
                ruta
            };
        } catch (error) {
            console.error('Error detallado de conexión con backend de rutas:', error);

            // Fallback local para no bloquear la funcionalidad cuando el backend no está activo.
            const localResult = calculateRouteLocally(binaryGrid, startPoint, endPoint);
            if (localResult.exito) {
                return {
                    exito: true,
                    ruta: localResult.ruta
                };
            }

            return {
                exito: false,
                error: `${localResult.error} (Backend no disponible en ${ROUTING_API_URL})`
            };
        }
    }
};
