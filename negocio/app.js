import { CityRepository } from '../acceso_datos/CityRepository.js';
import { Ciudad } from '../modelos/Ciudad.js';
import { CityManager } from './CityManager.js';
import { ViewController } from './viewController.js';

// Inicializar la aplicación
class App {
    constructor() {
        this.manager = CityManager.getInstance();
        this.selectedCell = null;
        this.selectedTipo = 'r';
        this.serviciosIniciados = false;

        this.view = new ViewController({
            onCellSelected: ({ x, y, tipo }) => {
                this.selectedCell = { x, y, tipo };
                this.actualizarUI();
            },
            onConstruir: (cell, tipo) => {
                const targetCell = cell || this.selectedCell || this.view.selectedCell;
                const effectiveTipo = tipo || this.selectedTipo || this.view.selectedTipo;

                if (!targetCell) {
                    alert('Primero selecciona una celda en el mapa antes de construir.');
                    console.error('Construir: no hay celda seleccionada', { cell, selectedCellApp: this.selectedCell, selectedCellView: this.view.selectedCell, tipo });
                    return;
                }

                if (!effectiveTipo) {
                    alert('Primero selecciona un tipo de construcción (R1, C1, I1, r, etc.).');
                    console.error('Construir: no hay tipo seleccionado', { tipo, selectedTipoApp: this.selectedTipo, selectedTipoView: this.view.selectedTipo });
                    return;
                }

                // Mostrar validación explícita antes de intentar construir
                const puede = this.manager.ciudad?.puedeConstruir(effectiveTipo, targetCell.x, targetCell.y);
                console.log('Validación de construcción:', { targetCell, effectiveTipo, puede });

                if (!puede) {
                    alert('No se puede construir aquí: verifica coordenada, disponibilidad o reglas de vía.');
                    console.warn('Construcción bloqueada (puedeConstruir=false)', { targetCell, effectiveTipo });
                    return;
                }

                const resultado = this.manager.construir(effectiveTipo, targetCell.x, targetCell.y);

                if (!resultado.exito) {
                    alert(`No se construyó: ${resultado.mensaje}`);
                    console.warn('Construir fallido', resultado, { targetCell, effectiveTipo });
                } else {
                    alert(`Construcción realizada: ${effectiveTipo} en (${targetCell.x}, ${targetCell.y})`);
                    console.log(`Construcción OK: ${effectiveTipo}@(${targetCell.x},${targetCell.y})`);
                }

                this.actualizarUI();
            },
            onDemoler: (cell) => {
                if (!cell) {
                    alert('Primero selecciona una celda en el mapa antes de demoler.');
                    return;
                }

                console.log('Intento demoler en', cell);
                const resultado = this.manager.demoler(cell.x, cell.y);
                if (!resultado.exito) {
                    alert(`No se demolió: ${resultado.mensaje}`);
                } else {
                    console.log(`Demolición OK @(${cell.x},${cell.y})`);
                }
                this.actualizarUI();
            },
            onProcesarTurno: () => this.procesarTurno(),
            onIniciarServicios: () => this.iniciarServiciosExternos(),
            onIniciarTurnos: () => {
                this.manager.iniciarCicloTurnos(() => this.actualizarUI());
                this.view.el.botonIniciarTurnos.disabled = true;
                this.view.el.botonDetenerTurnos.disabled = false;
            },
            onDetenerTurnos: () => {
                this.manager.detenerCicloTurnos();
                this.view.el.botonIniciarTurnos.disabled = false;
                this.view.el.botonDetenerTurnos.disabled = true;
            },
            onExportar: () => this.manager.exportToFile(),
            onGuardar: () => this.manager.save(),
            onCancelar: () => {
                this.selectedCell = null;
                this.actualizarUI();
            },
            onCrearCiudad: (data) => this.crearNuevaCiudad(data)
        });

        // Si ya hay estado guardado, cargar normalmente; si no, pedir creación de ciudad.
        const saved = CityRepository.load();
        if (saved) {
            this.manager.init();
            this.manager.iniciarAutoGuardado();
            this.actualizarUI();
        } else {
            this.view.showNewCityModal();
        }
    }

    crearNuevaCiudad({ nombre, alcalde, region, tamano, mapaTexto }) {
        // Crear ciudad en manager y guardarla
        this.manager.ciudad = new Ciudad(nombre, alcalde, region, tamano, tamano);

        // Si se cargó un mapa desde archivo, aplicarlo
        if (mapaTexto) {
            const resultado = this.manager.ciudad.cargarMapaDesdeTexto(mapaTexto);
            if (!resultado.exito) {
                alert(`No se pudo cargar el mapa: ${resultado.mensaje}`);
            }
        }

        this.manager.save();
        this.manager.iniciarAutoGuardado();
        this.actualizarUI();
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

        // Renderizar vista usando ViewController
        this.view.renderHeader(estado);
        this.view.renderEstadisticas(estado);
        this.view.renderRecursos(estado);
        this.view.renderClima(estado.clima);
        this.view.renderNoticias(estado.noticias);
        this.view.renderizarMapa(estado.mapa);
        this.view.saveLastRenderMatrix(estado.mapa);
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
                <span>Edificios Totales:</span>
                <span>${estado.edificios.total}</span>
            </div>
        `;
    }

    actualizarRecursos(estado) {
        document.getElementById('dinero').textContent = `$${estado.recursos.dinero}`;
        document.getElementById('electricidad').textContent = `${estado.recursos.electricidad} MW`;
        document.getElementById('agua').textContent = `${estado.recursos.agua} m³`;
        document.getElementById('alimentos').textContent = `${estado.recursos.comida} unidades`;
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
        const contenedor = document.getElementById('grid-container');
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
