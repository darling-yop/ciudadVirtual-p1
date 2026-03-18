/**
 * ViewController.js
 *
 * Maneja la interacción con la vista (DOM), renderizado y atajos de teclado.
 * Está desacoplado de la lógica de negocio (CityManager / App).
 */

export class ViewController {
    constructor({
        onCellSelected,
        onConstruir,
        onDemoler,
        onProcesarTurno,
        onIniciarServicios,
        onIniciarTurnos,
        onDetenerTurnos,
        onExportar,
        onGuardar,
        onCancelar
    } = {}) {
        this.onCellSelected = onCellSelected;
        this.onConstruir = onConstruir;
        this.onDemoler = onDemoler;
        this.onProcesarTurno = onProcesarTurno;
        this.onIniciarServicios = onIniciarServicios;
        this.onIniciarTurnos = onIniciarTurnos;
        this.onDetenerTurnos = onDetenerTurnos;
        this.onExportar = onExportar;
        this.onGuardar = onGuardar;
        this.onCancelar = onCancelar;

        this.selectedTipo = 'r';
        this.selectedCell = null;

        this._bindElements();
        this._bindEvents();
    }

    _bindElements() {
        this.el = {
            nombreCiudad: document.getElementById('nombre-ciudad'),
            turno: document.getElementById('turno'),
            puntuacion: document.getElementById('puntuacion'),
            recursosContenido: document.getElementById('recursos-contenido'),
            climaContenido: document.getElementById('clima-contenido'),
            noticiasContenido: document.getElementById('noticias-contenido'),
            estadisticasContenido: document.getElementById('estadisticas-contenido'),
            gridContainer: document.getElementById('grid-container'),
            infoCelda: document.getElementById('info-celda'),
            botonProcesarTurno: document.getElementById('procesar-turno'),
            botonIniciarServicios: document.getElementById('iniciar-servicios'),
            botonIniciarTurnos: document.getElementById('boton-iniciar-turnos'),
            botonDetenerTurnos: document.getElementById('boton-detener-turnos'),
            botonExportar: document.getElementById('boton-exportar'),
            botonConstruir: document.getElementById('boton-construir'),
            botonDemoler: document.getElementById('boton-demoler'),
            botonToggleRecursos: document.getElementById('toggle-recursos'),
            construccionMenu: document.querySelector('.construccion-menu'),
            recursosPanel: document.querySelector('.recursos-panel'),
            tipoButtons: Array.from(document.querySelectorAll('.construccion-menu button[data-tipo]')),
            newCityModal: document.getElementById('new-city-modal'),
            newCityForm: document.getElementById('new-city-form'),
            inputCiudad: document.getElementById('input-ciudad'),
            inputAlcalde: document.getElementById('input-alcalde'),
            inputRegion: document.getElementById('input-region'),
            inputLat: document.getElementById('input-lat'),
            inputLon: document.getElementById('input-lon'),
            inputTamano: document.getElementById('input-tamano'),
            regionCustom: document.getElementById('region-custom')
        };
    }

    _bindEvents() {
        if (this.el.botonProcesarTurno) {
            this.el.botonProcesarTurno.addEventListener('click', () => {
                this.onProcesarTurno?.();
            });
        }

        if (this.el.botonIniciarServicios) {
            this.el.botonIniciarServicios.addEventListener('click', () => {
                this.onIniciarServicios?.();
            });
        }

        if (this.el.botonToggleRecursos) {
            this.el.botonToggleRecursos.addEventListener('click', () => {
                this._toggleRecursosPanel();
            });
        }

        if (this.el.botonIniciarTurnos) {
            this.el.botonIniciarTurnos.addEventListener('click', () => {
                this.onIniciarTurnos?.();
            });
        }

        if (this.el.botonDetenerTurnos) {
            this.el.botonDetenerTurnos.addEventListener('click', () => {
                this.onDetenerTurnos?.();
            });
        }

        if (this.el.botonExportar) {
            this.el.botonExportar.addEventListener('click', () => {
                this.onExportar?.();
            });
        }

        if (this.el.newCityForm) {
            this.el.newCityForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const data = this._gatherNewCityData();
                if (data) {
                    this.hideNewCityModal();
                    this.onCrearCiudad?.(data);
                }
            });
        }

        if (this.el.inputRegion) {
            this.el.inputRegion.addEventListener('change', () => {
                this._updateRegionInputs();
            });
        }

        if (this.el.botonConstruir) {
            this.el.botonConstruir.addEventListener('click', () => {
                this.onConstruir?.(this.selectedCell, this.selectedTipo);
            });
        }

        if (this.el.botonDemoler) {
            this.el.botonDemoler.addEventListener('click', () => {
                this.onDemoler?.(this.selectedCell);
            });
        }

        this.el.tipoButtons.forEach(btn => {
            btn.addEventListener('click', (event) => {
                const tipo = event.target.dataset.tipo;
                if (tipo) {
                    this.selectedTipo = tipo;
                    this._highlightSelectedTipo();
                }
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return; // evitar atajos mientras escribe en campos de texto
            }

            switch (event.key.toLowerCase()) {
                case 'b':
                    this._toggleConstruccionMenu();
                    break;
                case 'r':
                    this.selectedTipo = 'r';
                    this._highlightSelectedTipo();
                    this._toggleConstruccionMenu(true);
                    break;
                case 'd':
                    this.onDemoler?.(this.selectedCell);
                    break;
                case 's':
                    this.onGuardar?.();
                    break;
                case 'escape':
                    this.clearSelection();
                    this.onCancelar?.();
                    break;
                default:
                    break;
            }
        });
    }

    _toggleConstruccionMenu(forceOpen = null) {
        if (!this.el.construccionMenu) return;
        const isOpen = this.el.construccionMenu.classList.contains('open');
        const shouldOpen = forceOpen === true ? true : (forceOpen === false ? false : !isOpen);
        this.el.construccionMenu.classList.toggle('open', shouldOpen);
        if (shouldOpen) {
            this.el.construccionMenu.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    _toggleRecursosPanel() {
        if (!this.el.recursosPanel) return;
        this.el.recursosPanel.classList.toggle('show');
        if (this.el.recursosPanel.classList.contains('show')) {
            this.el.recursosPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showNewCityModal() {
        this.el.newCityModal?.classList.remove('hidden');
        this.el.newCityModal?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    hideNewCityModal() {
        this.el.newCityModal?.classList.add('hidden');
    }

    _updateRegionInputs() {
        if (!this.el.inputRegion || !this.el.regionCustom) return;
        const isCustom = this.el.inputRegion.value === 'custom';
        this.el.regionCustom.classList.toggle('hidden', !isCustom);
    }

    _gatherNewCityData() {
        const nombre = this.el.inputCiudad?.value?.trim();
        const alcalde = this.el.inputAlcalde?.value?.trim();
        const regionKey = this.el.inputRegion?.value;
        const tamano = Number(this.el.inputTamano?.value);

        if (!nombre || !alcalde) {
            alert('Completa los campos de nombre de ciudad y alcalde.');
            return null;
        }

        if (!tamano || tamano < 15 || tamano > 30) {
            alert('El tamaño del mapa debe estar entre 15 y 30.');
            return null;
        }

        const regiones = {
            buenosaires: { nombre: 'Buenos Aires', coordenadas: { lat: -34.6037, lon: -58.3816 } },
            mexico: { nombre: 'Ciudad de México', coordenadas: { lat: 19.4326, lon: -99.1332 } },
            madrid: { nombre: 'Madrid', coordenadas: { lat: 40.4168, lon: -3.7038 } }
        };

        let region = regiones[regionKey];
        if (regionKey === 'custom') {
            const lat = parseFloat(this.el.inputLat?.value);
            const lon = parseFloat(this.el.inputLon?.value);
            if (Number.isNaN(lat) || Number.isNaN(lon)) {
                alert('Ingresa latitud y longitud válidas.');
                return null;
            }
            region = { nombre: 'Personalizada', coordenadas: { lat, lon } };
        }

        return { nombre, alcalde, region, tamano };
    }

    _highlightSelectedTipo() {
        if (!this.el.tipoButtons) return;
        this.el.tipoButtons.forEach(btn => {
            if (btn.dataset.tipo === this.selectedTipo) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }

    renderizarMapa(matriz) {
        if (!this.el.gridContainer) return;

        this._lastRenderedMatrix = matriz;

        const ancho = matriz?.dimensiones?.ancho ?? (matriz?.[0]?.length ?? 0);
        const alto = matriz?.dimensiones?.alto ?? (matriz?.length ?? 0);
        const grid = matriz?.grid ?? matriz;

        this.el.gridContainer.style.gridTemplateColumns = `repeat(${ancho}, 26px)`;
        this.el.gridContainer.innerHTML = '';

        if (!Array.isArray(grid) || grid.length === 0) {
            this.el.gridContainer.innerHTML = '<p>Mapa no disponible.</p>';
            return;
        }

        grid.forEach((fila, y) => {
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
                    this.onCellSelected?.({ x, y, tipo });
                    this._renderSelectedCellInfo();
                });

                this.el.gridContainer.appendChild(cell);
            });
        });

        this._renderSelectedCellInfo();
    }

    _renderSelectedCellInfo() {
        if (!this.el.infoCelda) return;
        if (this.selectedCell) {
            this.el.infoCelda.textContent = `Celda seleccionada: (${this.selectedCell.x}, ${this.selectedCell.y}) tipo: ${this.selectedCell.tipo}`;
        } else {
            this.el.infoCelda.textContent = 'Seleccione una celda para construir o demoler.';
        }
    }

    renderHeader(estado) {
        if (!estado) return;
        if (this.el.nombreCiudad) this.el.nombreCiudad.textContent = estado.nombre;
        if (this.el.turno) this.el.turno.textContent = `Turno: ${estado.turno}`;
        if (this.el.puntuacion) this.el.puntuacion.textContent = `Puntuación: ${estado.puntuacion}`;
    }

    renderEstadisticas(estado) {
        if (!this.el.estadisticasContenido) return;
        this.el.estadisticasContenido.innerHTML = `
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

    renderRecursos(estado) {
        const dineroEl = document.getElementById('dinero');
        const electricidadEl = document.getElementById('electricidad');
        const aguaEl = document.getElementById('agua');
        const alimentosEl = document.getElementById('alimentos');

        if (dineroEl) {
            dineroEl.textContent = `$${estado.recursos.dinero}`;
            const container = dineroEl.parentElement;
            container?.classList.remove('dinero-verde', 'dinero-amarillo', 'dinero-rojo');
            if (estado.recursos.dinero > 10000) {
                container?.classList.add('dinero-verde');
            } else if (estado.recursos.dinero < 1000) {
                container?.classList.add('dinero-rojo');
            } else if (estado.recursos.dinero < 5000) {
                container?.classList.add('dinero-amarillo');
            }
        }

        if (electricidadEl) {
            electricidadEl.textContent = `${estado.recursos.electricidad} MW`;
        }
        if (aguaEl) {
            aguaEl.textContent = `${estado.recursos.agua} m³`;
        }
        if (alimentosEl) {
            alimentosEl.textContent = `${estado.recursos.comida} unidades`;
        }
    }

    renderClima(clima) {
        if (!this.el.climaContenido) return;
        if (clima?.ultimaActualizacion) {
            this.el.climaContenido.innerHTML = `
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
            this.el.climaContenido.innerHTML = '<p>Datos climáticos no disponibles. Inicie los servicios externos.</p>';
        }
    }

    renderNoticias(noticias) {
        if (!this.el.noticiasContenido) return;
        if (Array.isArray(noticias) && noticias.length > 0) {
            this.el.noticiasContenido.innerHTML = noticias.map(noticia => `
                <div class="noticia-item">
                    <h3>${noticia.titulo}</h3>
                    <p>${noticia.descripcion || 'Sin descripción disponible'}</p>
                    ${noticia.enlace ? `<a href="${noticia.enlace}" target="_blank" rel="noopener">Leer más</a>` : ''}
                </div>
            `).join('');
        } else {
            this.el.noticiasContenido.innerHTML = '<p>No hay noticias disponibles. Inicie los servicios externos.</p>'; 
        }
    }

    clearSelection() {
        this.selectedCell = null;
        this._renderSelectedCellInfo();
        if (this.el.gridContainer) {
            // Re-render to remove selection highlights
            const matrix = this._lastRenderedMatrix;
            if (matrix) this.renderizarMapa(matrix);
        }
    }

    saveLastRenderMatrix(matriz) {
        this._lastRenderedMatrix = matriz;
    }
}
