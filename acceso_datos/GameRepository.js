/**
 * GameRepository.js
 *
 * Proporciona una capa de acceso a datos para sincronizar el estado del juego
 * con un backend REST. Se usa como complemento del almacenamiento local (LocalStorage).
 *
 * Para usarlo, exponga en el backend las siguientes rutas (pueden adaptarse):
 *  - GET  /api/game     -> retorna el estado completo de la ciudad
 *  - POST /api/game     -> guarda/actualiza el estado de la ciudad
 */

const BASE_URL = (typeof window !== 'undefined' && window.GAME_API_BASE_URL) ? window.GAME_API_BASE_URL : '/api';

const ENDPOINT = `${BASE_URL}/game`;

export const GameRepository = {
    async load() {
        try {
            const response = await fetch(ENDPOINT, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                console.warn('GameRepository.load: response not ok', response.status);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.warn('GameRepository.load error:', error);
            return null;
        }
    },

    async save(state) {
        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
            if (!response.ok) {
                console.warn('GameRepository.save: response not ok', response.status);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.warn('GameRepository.save error:', error);
            return null;
        }
    }
};
