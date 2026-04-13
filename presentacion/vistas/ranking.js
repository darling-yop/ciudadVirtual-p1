/**
 * ranking.js
 * Controlador para la vista de ranking de ciudades.
 * Renderiza el TOP 10 y destaca la ciudad actual.
 */
import { RankingLocal } from '../../acceso_datos/RankingLocal.js';

class RankingController {
    constructor() {
        this.rankingLocal = new RankingLocal();
        this.rankingTable = document.getElementById('ranking-body');
        this.currentCityInfo = document.getElementById('current-city-info');
        this.btnRefresh = document.getElementById('btn-refresh-ranking');
        this.btnReset = document.getElementById('btn-reset-ranking');
        this.btnExport = document.getElementById('btn-export-ranking');
        this.btnBack = document.getElementById('btn-back-to-game');

        this.init();
    }

    init() {
        this.cargarRanking();
        this.configurarEventos();
    }

    configurarEventos() {
        this.btnRefresh.addEventListener('click', () => this.cargarRanking());
        this.btnReset.addEventListener('click', () => this.reiniciarRanking());
        this.btnExport.addEventListener('click', () => this.exportarRanking());
        this.btnBack.addEventListener('click', () => this.volverAlJuego());
    }

    cargarRanking() {
        const ranking = this.rankingLocal.obtenerRanking();
        const ciudadActual = this.obtenerCiudadActual();

        this.renderizarRanking(ranking, ciudadActual);
        this.mostrarInformacionCiudadActual(ranking, ciudadActual);
    }

    obtenerCiudadActual() {
        try {
            const estadoGuardado = localStorage.getItem('ciudadVirtual_estado');
            if (estadoGuardado) {
                return JSON.parse(estadoGuardado);
            }
        } catch (error) {
            console.error('Error obteniendo ciudad actual:', error);
        }
        return null;
    }

    renderizarRanking(ranking, ciudadActual) {
        this.rankingTable.innerHTML = '';

        ranking.forEach((ciudad, index) => {
            const fila = document.createElement('tr');

            // Destacar si es la ciudad actual
            if (ciudadActual && ciudad.cityId === ciudadActual.cityId) {
                fila.classList.add('current-city');
            }

            fila.innerHTML = `
                <td>${index + 1}</td>
                <td>${ciudad.nombre}</td>
                <td>${ciudad.alcaldeNombre}</td>
                <td>${ciudad.poblacion ?? 0}</td>
                <td>${ciudad.felicidadPromedio ?? 0}%</td>
                <td>${ciudad.puntuacionAcumulada.toLocaleString()}</td>
                <td>${ciudad.turnoActual}</td>
                <td>${new Date(ciudad.fechaGuardado).toLocaleDateString()}</td>
            `;

            this.rankingTable.appendChild(fila);
        });

        // Si no hay ciudades en el ranking
        if (ranking.length === 0) {
            const filaVacia = document.createElement('tr');
            filaVacia.innerHTML = '<td colspan="8">No hay ciudades en el ranking aún.</td>';
            this.rankingTable.appendChild(filaVacia);
        }
    }

    mostrarInformacionCiudadActual(ranking, ciudadActual) {
        this.currentCityInfo.innerHTML = '';

        if (!ciudadActual) {
            this.currentCityInfo.innerHTML = '<p>No se pudo cargar la información de tu ciudad.</p>';
            return;
        }

        const posicion = this.rankingLocal.obtenerPosicionActual({ cityId: ciudadActual.cityId });

        if (posicion > 0 && posicion <= 10) {
            // Ya está en el top 10, no mostrar información adicional
            return;
        }

        // Mostrar posición actual si no está en top 10
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('current-city-position');
        infoDiv.innerHTML = `
            <h3>Tu Ciudad: ${ciudadActual.nombre}</h3>
            <p>Puntuación: ${ciudadActual.puntuacionAcumulada.toLocaleString()}</p>
            <p>Posición actual: ${posicion === 0 ? 'Fuera del top 10' : `Posición ${posicion}`}</p>
            <p>Sigue jugando para entrar al top 10!</p>
        `;

        this.currentCityInfo.appendChild(infoDiv);
    }

    reiniciarRanking() {
        const reiniciado = this.rankingLocal.limpiarRanking();
        if (reiniciado) {
            this.cargarRanking();
        }
    }

    exportarRanking() {
        const ranking = this.rankingLocal.obtenerRanking();
        const contenido = JSON.stringify(ranking, null, 2);
        const blob = new Blob([contenido], { type: 'application/json' });
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = `ranking_ciudad_virtual_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
    }

    volverAlJuego() {
        // Navegar de vuelta al juego
        window.location.href = 'game.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new RankingController();
});