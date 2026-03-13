import { CityManager } from './CityManager.js';

// Inicializar la aplicación
class App {
    constructor() {
        this.manager = CityManager.getInstance();
        this.selectedCell = null;
        this.selectedTipo = 'r';
        this.serviciosIniciados = false;

        this.inicializarEventos();

        this.manager.init();
        this.manager.iniciarAutoGuardado();
        this.actualizarUI();
    }

    inicializarEventos() {
        document.addEventListener('DOMContentLoaded', () => {
            this.actualizarUI();
        });

        document.getElementById('procesar-turno').addEventListener('click', () => {
            this.procesarTurno();
        });

        document.getElementById('iniciar-servicios').addEventListener('click', () => {
            this.iniciarServiciosExternos();
        });

        document.getElementById('boton-iniciar-turnos').addEventListener('click', () => {
            this.manager.iniciarCicloTurnos(() => this.actualizarUI());
            document.getElementById('boton-iniciar-turnos').disabled = true;
            document.getElementById('boton-detener-turnos').disabled = false;
        });

        document.getElementById('boton-detener-turnos').addEventListener('click', () => {
            this.manager.detenerCicloTurnos();
            document.getElementById('boton-iniciar-turnos').disabled = false;
            document.getElementById('boton-detener-turnos').disabled = true;
        });

        document.getElementById('boton-exportar').addEventListener('click', () => {
            this.manager.exportToFile();
        });

        document.getElementById('selector-tipo').addEventListener('change', (e) => {
            this.selectedTipo = e.target.value;
        });

        document.getElementById('boton-construir').addEventListener('click', () => {
            if (!this.selectedCell) return;
            const { x, y } = this.selectedCell;
            const resultado = this.manager.construir(this.selectedTipo, x, y);
            if (!resultado.exito) {
                alert(resultado.mensaje);
            }
            this.actualizarUI();
        });

        document.getElementById('boton-demoler').addEventListener('click', () => {
            if (!this.selectedCell) return;
            const { x, y } = this.selectedCell;
            const resultado = this.manager.demoler(x, y);
            if (!resultado.exito) {
                alert(resultado.mensaje);
            }
            this.actualizarUI();
        });
    }

    iniciarServiciosExternos() {
        if (!this.serviciosIniciados) {
            const ciudad = this.manager.ciudad;
            if (ciudad) {
                ciudad.iniciarServiciosExternos();
                this.serviciosIniciados = true;
                document.getElementById('iniciar-servicios').disabled = true;
                document.getElementById('iniciar-servicios').textContent = 'Servicios Iniciados';
                console.log('Servicios externos iniciados');
            }
        }
    }

    procesarTurno() {
        this.manager.procesarTurno();
        this.actualizarUI();
    }

    actualizarUI() {
        const estado = this.manager.obtenerEstado();
        if (!estado) return;

        // Actualizar header
        document.getElementById('nombre-ciudad').textContent = estado.nombre;
        document.getElementById('turno').textContent = `Turno: ${estado.turno}`;
        document.getElementById('puntuacion').textContent = `Puntuación: ${estado.puntuacion}`;

        // Actualizar secciones
        this.actualizarEstadisticas(estado);
        this.actualizarClima(estado.clima);
        this.actualizarNoticias(estado.noticias);
        this.renderMapa(estado.mapa);
    }

    actualizarEstadisticas(estado) {
        const contenedor = document.getElementById('estadisticas-contenido');
        contenedor.innerHTML = `
            <div class="recurso">
                <span>Población Total:</span>
                <span>${estado.poblacion.total}</span>
            </div>
            <div class="recurso">
                <span>Con Vivienda:</span>
                <span>${estado.poblacion.conVivienda}</span>
            </div>
            <div class="recurso">
                <span>Con Empleo:</span>
                <span>${estado.poblacion.conEmpleo}</span>
            </div>
            <div class="recurso">
                <span>Felicidad Promedio:</span>
                <span>${estado.poblacion.felicidadPromedio}%</span>
            </div>
            <div class="recurso">
                <span>Dinero:</span>
                <span>$${estado.recursos.dinero}</span>
            </div>
            <div class="recurso">
                <span>Electricidad:</span>
                <span>${estado.recursos.electricidad} MW</span>
            </div>
            <div class="recurso">
                <span>Agua:</span>
                <span>${estado.recursos.agua} m³</span>
            </div>
            <div class="recurso">
                <span>Comida:</span>
                <span>${estado.recursos.comida} unidades</span>
            </div>
            <div class="recurso">
                <span>Edificios Totales:</span>
                <span>${estado.edificios.total}</span>
            </div>
        `;
    }

    actualizarClima(clima) {
        const contenedor = document.getElementById('clima-contenido');
        if (clima.ultimaActualizacion) {
            contenedor.innerHTML = `
                <div class="recurso">
                    <span>Condición:</span>
                    <span>${clima.condicion}</span>
                </div>
                <div class="recurso">
                    <span>Temperatura:</span>
                    <span>${clima.temperatura}°C</span>
                </div>
                <div class="recurso">
                    <span>Humedad:</span>
                    <span>${clima.humedad}%</span>
                </div>
                <div class="recurso">
                    <span>Viento:</span>
                    <span>${clima.velocidadViento} km/h</span>
                </div>
                <div class="recurso">
                    <span>Última actualización:</span>
                    <span>${clima.ultimaActualizacion.toLocaleString()}</span>
                </div>
            `;
        } else {
            contenedor.innerHTML = '<p>Datos climáticos no disponibles. Inicie los servicios externos.</p>';
        }
    }

    actualizarNoticias(noticias) {
        const contenedor = document.getElementById('noticias-contenido');
        if (noticias && noticias.length > 0) {
            contenedor.innerHTML = noticias.map(noticia => `
                <div class="noticia-item">
                    <h3>${noticia.titulo}</h3>
                    <p>${noticia.descripcion || 'Sin descripción disponible'}</p>
                    ${noticia.enlace ? `<a href="${noticia.enlace}" target="_blank">Leer más</a>` : ''}
                </div>
            `).join('');
        } else {
            contenedor.innerHTML = '<p>No hay noticias disponibles. Inicie los servicios externos.</p>';
        }
    }

    renderMapa(mapa) {
        const contenedor = document.getElementById('mapa-grid');
        const info = document.getElementById('info-celda');

        if (!mapa || !Array.isArray(mapa.grid)) {
            contenedor.innerHTML = '<p>Mapa no disponible.</p>';
            return;
        }

        contenedor.style.gridTemplateColumns = `repeat(${mapa.dimensiones.ancho}, 26px)`;
        contenedor.innerHTML = '';

        mapa.grid.forEach((fila, y) => {
            fila.forEach((tipo, x) => {
                const cell = document.createElement('div');
                cell.className = `map-cell map-cell--${tipo}`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.title = `(${x}, ${y}) - ${tipo}`;

                if (this.selectedCell && this.selectedCell.x === x && this.selectedCell.y === y) {
                    cell.classList.add('map-cell--selected');
                }

                cell.addEventListener('click', () => {
                    this.selectedCell = { x, y, tipo };
                    this.actualizarSeleccion();
                });

                contenedor.appendChild(cell);
            });
        });

        if (info) {
            if (this.selectedCell) {
                info.textContent = `Celda seleccionada: (${this.selectedCell.x}, ${this.selectedCell.y}) tipo: ${this.selectedCell.tipo}`;
            } else {
                info.textContent = 'Seleccione una celda para construir o demoler.';
            }
        }
    }

    actualizarSeleccion() {
        this.actualizarUI();
    }
}

// Inicializar la aplicación
const app = new App();
