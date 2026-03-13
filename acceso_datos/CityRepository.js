/**
 * CityRepository.js
 * Patrón Repository para persistir el estado de la ciudad en LocalStorage.
 * Proporciona métodos para guardar, cargar, limpiar y exportar el estado.
 */

const STORAGE_KEY = 'ciudadVirtual_estado';

export const CityRepository = {
    save(ciudadObjeto) {
        try {
            const json = JSON.stringify(ciudadObjeto);
            localStorage.setItem(STORAGE_KEY, json);
            return true;
        } catch (error) {
            console.error('CityRepository.save', error);
            return false;
        }
    },

    load() {
        try {
            const json = localStorage.getItem(STORAGE_KEY);
            if (!json) return null;
            return JSON.parse(json);
        } catch (error) {
            console.error('CityRepository.load', error);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    },

    exportToFile(ciudadObjeto, filename = 'ciudad_exportada.json') {
        try {
            const blob = new Blob([JSON.stringify(ciudadObjeto, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('CityRepository.exportToFile', error);
        }
    }
};
