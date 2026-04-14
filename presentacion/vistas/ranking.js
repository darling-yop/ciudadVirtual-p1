/**
 * ranking.js
 * Controlador para la vista de ranking de ciudades con elementos motivacionales.
 * Implementa Épica 6: Mostrar puntuación y competir para motivar mejoras.
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
        this.mostrarEstadisticasJugador(ciudadActual, ranking);
        this.mostrarComparacionLider(ciudadActual, ranking);
        this.mostrarEstadisticasRanking(ranking);
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

    mostrarEstadisticasJugador(ciudadActual, ranking) {
        const scoreElement = document.getElementById('current-score');
        const trendElement = document.getElementById('score-trend');
        const messageElement = document.getElementById('motivational-message');
        const positionBadge = document.getElementById('position-badge');
        const positionMessage = document.getElementById('position-message');

        if (!ciudadActual) {
            scoreElement.textContent = '0';
            trendElement.textContent = '↗️ +0';
            messageElement.textContent = '¡Crea una ciudad para comenzar!';
            positionBadge.textContent = '#--';
            positionMessage.textContent = 'Sin ciudad';
            return;
        }

        const puntuacionActual = ciudadActual.puntuacionAcumulada || 0;
        scoreElement.textContent = puntuacionActual.toLocaleString();

        // Calcular tendencia (comparar con puntuación anterior si existe)
        const puntuacionAnterior = this.obtenerPuntuacionAnterior(ciudadActual.cityId);
        const diferencia = puntuacionActual - puntuacionAnterior;
        if (diferencia > 0) {
            trendElement.textContent = `↗️ +${diferencia.toLocaleString()}`;
            trendElement.style.color = '#4CAF50';
        } else if (diferencia < 0) {
            trendElement.textContent = `↘️ ${diferencia.toLocaleString()}`;
            trendElement.style.color = '#f44336';
        } else {
            trendElement.textContent = '→ 0';
            trendElement.style.color = '#9E9E9E';
        }

        // Calcular posición
        const posicion = this.rankingLocal.obtenerPosicionActual({ cityId: ciudadActual.cityId });
        if (posicion > 0 && posicion <= 10) {
            positionBadge.textContent = `#${posicion}`;
            positionBadge.className = `position-badge position-${posicion}`;
            positionMessage.textContent = this.obtenerMensajePosicion(posicion);
        } else if (posicion > 10) {
            positionBadge.textContent = `#${posicion}`;
            positionBadge.className = 'position-badge position-out';
            positionMessage.textContent = '¡Sigue mejorando para entrar al top 10!';
        } else {
            positionBadge.textContent = '#--';
            positionBadge.className = 'position-badge position-none';
            positionMessage.textContent = 'Tu ciudad no está en el ranking aún';
        }

        // Mensaje motivacional
        messageElement.textContent = this.generarMensajeMotivacional(ciudadActual, ranking, posicion);
    }

    obtenerPuntuacionAnterior(cityId) {
        // Buscar la puntuación anterior en el ranking histórico (simplificado)
        try {
            const rankingHistorico = JSON.parse(localStorage.getItem('ciudadVirtual_ranking_historico') || '[]');
            const entradaAnterior = rankingHistorico.find(entry => entry.cityId === cityId);
            return entradaAnterior ? entradaAnterior.puntuacionAcumulada : 0;
        } catch {
            return 0;
        }
    }

    obtenerMensajePosicion(posicion) {
        const mensajes = {
            1: '¡Eres el líder! 🏆',
            2: '¡Segundo lugar! ¡Muy cerca del primero!',
            3: '¡Tercer lugar! ¡Excelente trabajo!',
            4: '¡Cuarto lugar! ¡Sigue así!',
            5: '¡Quinto lugar! ¡Vas por buen camino!',
            6: '¡Sexto lugar! ¡No te rindas!',
            7: '¡Séptimo lugar! ¡Puedes mejorar!',
            8: '¡Octavo lugar! ¡Esfuerzo constante!',
            9: '¡Noveno lugar! ¡Casi en el top 10!',
            10: '¡Décimo lugar! ¡Último del top 10!'
        };
        return mensajes[posicion] || `Posición ${posicion}`;
    }

    generarMensajeMotivacional(ciudadActual, ranking, posicion) {
        if (!ranking || ranking.length === 0) {
            return '¡Sé el primero en crear una gran ciudad!';
        }

        const lider = ranking[0];
        const puntosLider = lider.puntuacionAcumulada;
        const misPuntos = ciudadActual.puntuacionAcumulada || 0;

        if (posicion === 1) {
            return '¡Eres el mejor alcalde! ¿Puedes mantener el liderazgo?';
        } else if (posicion <= 3) {
            return `¡Estás entre los mejores! Solo ${puntosLider - misPuntos} puntos te separan del primer lugar.`;
        } else if (posicion <= 10) {
            return '¡Estás en el top 10! Sigue mejorando para subir posiciones.';
        } else {
            const puntosNecesarios = ranking[9] ? ranking[9].puntuacionAcumulada - misPuntos + 1 : 1000;
            return `¡Entra al top 10! Necesitas ${puntosNecesarios} puntos más. ¡Tú puedes!`;
        }
    }

    mostrarComparacionLider(ciudadActual, ranking) {
        const leaderScoreElement = document.getElementById('leader-score');
        const pointsNeededElement = document.getElementById('points-needed');
        const progressFill = document.getElementById('progress-fill');

        if (!ranking || ranking.length === 0) {
            leaderScoreElement.textContent = '0';
            pointsNeededElement.textContent = '0';
            progressFill.style.width = '0%';
            return;
        }

        const lider = ranking[0];
        const puntosLider = lider.puntuacionAcumulada;
        const misPuntos = ciudadActual ? (ciudadActual.puntuacionAcumulada || 0) : 0;

        leaderScoreElement.textContent = puntosLider.toLocaleString();

        if (misPuntos >= puntosLider) {
            pointsNeededElement.textContent = '¡Eres el líder!';
            progressFill.style.width = '100%';
        } else {
            const puntosNecesarios = puntosLider - misPuntos;
            pointsNeededElement.textContent = puntosNecesarios.toLocaleString();
            const progreso = Math.min((misPuntos / puntosLider) * 100, 95); // Máximo 95% si no eres líder
            progressFill.style.width = `${progreso}%`;
        }
    }

    mostrarEstadisticasRanking(ranking) {
        const totalCitiesElement = document.getElementById('total-cities');
        const avgScoreElement = document.getElementById('avg-score');
        const oldestCityElement = document.getElementById('oldest-city');
        const happiestCityElement = document.getElementById('happiest-city');

        if (!ranking || ranking.length === 0) {
            totalCitiesElement.textContent = '0';
            avgScoreElement.textContent = '0';
            oldestCityElement.textContent = '-';
            happiestCityElement.textContent = '-';
            return;
        }

        // Total de ciudades
        totalCitiesElement.textContent = ranking.length;

        // Puntuación promedio
        const sumaPuntuaciones = ranking.reduce((sum, city) => sum + city.puntuacionAcumulada, 0);
        const promedio = Math.round(sumaPuntuaciones / ranking.length);
        avgScoreElement.textContent = promedio.toLocaleString();

        // Ciudad más antigua (por turno actual)
        const ciudadMasAntigua = ranking.reduce((oldest, current) =>
            (current.turnoActual > oldest.turnoActual) ? current : oldest
        );
        oldestCityElement.textContent = `${ciudadMasAntigua.nombre} (${ciudadMasAntigua.turnoActual} turnos)`;

        // Ciudad más feliz
        const ciudadMasFeliz = ranking.reduce((happiest, current) =>
            ((current.felicidadPromedio || 0) > (happiest.felicidadPromedio || 0)) ? current : happiest
        );
        happiestCityElement.textContent = `${ciudadMasFeliz.nombre} (${ciudadMasFeliz.felicidadPromedio || 0}%)`;
    }

    renderizarRanking(ranking, ciudadActual) {
        this.rankingTable.innerHTML = '';

        ranking.forEach((ciudad, index) => {
            const fila = document.createElement('tr');

            // Destacar si es la ciudad actual
            if (ciudadActual && ciudad.cityId === ciudadActual.cityId) {
                fila.classList.add('current-city');
                fila.innerHTML += '<td>⭐</td>'; // Icono especial para la ciudad actual
            } else {
                fila.innerHTML += '<td></td>';
            }

            fila.innerHTML += `
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
            filaVacia.innerHTML = '<td colspan="9">No hay ciudades en el ranking aún. ¡Sé el primero!</td>';
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
            <h3>🎯 Tu Ciudad: ${ciudadActual.nombre}</h3>
            <p><strong>Puntuación:</strong> ${ciudadActual.puntuacionAcumulada.toLocaleString()}</p>
            <p><strong>Posición actual:</strong> ${posicion === 0 ? 'Fuera del ranking' : `Posición ${posicion}`}</p>
            <p><strong>Población:</strong> ${ciudadActual.poblacion || 0}</p>
            <p><strong>Felicidad:</strong> ${ciudadActual.felicidadPromedio || 0}%</p>
            <p class="motivation-text">💪 ¡Sigue jugando y mejora tu ciudad para entrar al top 10!</p>
        `;

        this.currentCityInfo.appendChild(infoDiv);
    }

    reiniciarRanking() {
        if (confirm('¿Estás seguro de que quieres reiniciar el ranking? Esta acción no se puede deshacer.')) {
            const reiniciado = this.rankingLocal.limpiarRanking();
            if (reiniciado) {
                this.cargarRanking();
                alert('Ranking reiniciado exitosamente.');
            } else {
                alert('Error al reiniciar el ranking.');
            }
        }
    }

    exportarRanking() {
        const ranking = this.rankingLocal.obtenerRanking();
        if (ranking.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

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