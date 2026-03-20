/**
 * ViewController.js
 *
 * Maneja la interacción con la vista (DOM), renderizado y atajos de teclado.
 * Está desacoplado de la lógica de negocio (CityManager / App).
 */

import { Mapa } from '../modelos/Mapa.js';

export class ViewController {
    constructor({
        onCellSelected,
        onConstruir,
        onDemoler,
        onProcesarTurno,
        onIniciarServicios,
        onIniciarTurnos,
        onDetenerTurnos,
        onCalcularRuta,
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
        this.onCalcularRuta = onCalcularRuta;
        this.onExportar = onExportar;
        this.onGuardar = onGuardar;
        this.onCancelar = onCancelar;

        this.selectedTipo = 'r';
        this.selectedCell = null;
        this.mapaTexto = null;
        this.mapaGrid = null;
        this.routeCells = [];
        this.routeWalkerCell = null;
        this.routeAnimationToken = 0;

        this.colombiaMunicipios = {
            'Cundinamarca': {
                'Bogotá': { lat: 4.711, lon: -74.072 },
                'Soacha': { lat: 4.579, lon: -74.212 }
            },
            'Antioquia': {
                'Medellín': { lat: 6.244, lon: -75.581 },
                'Envigado': { lat: 6.159, lon: -75.578 }
            },
            'Valle del Cauca': {
                'Cali': { lat: 3.451, lon: -76.531 },
                'Palmira': { lat: 3.539, lon: -76.303 }
            }
        };

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
            botonCalcularRuta: document.getElementById('boton-calcular-ruta'),
            botonLimpiarRuta: document.getElementById('boton-limpiar-ruta'),
            selectRutaOrigen: document.getElementById('ruta-origen'),
            selectRutaDestino: document.getElementById('ruta-destino'),
            estadoRuta: document.getElementById('estado-ruta'),
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
            regionCustom: document.getElementById('region-custom'),
            regionColombia: document.getElementById('region-colombia'),
            inputDepartamento: document.getElementById('input-departamento'),
            inputMunicipio: document.getElementById('input-municipio'),
            botonCargarMapa: document.getElementById('boton-cargar-mapa'),
            inputMapaArchivo: document.getElementById('input-mapa-archivo'),
            estadoMapa: document.getElementById('estado-mapa')
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

        if (this.el.botonCalcularRuta) {
            this.el.botonCalcularRuta.addEventListener('click', async () => {
                const idOrigen = this.el.selectRutaOrigen?.value;
                const idDestino = this.el.selectRutaDestino?.value;
                await this.onCalcularRuta?.(idOrigen, idDestino);
            });
        }

        if (this.el.botonLimpiarRuta) {
            this.el.botonLimpiarRuta.addEventListener('click', () => {
                this.limpiarRuta();
                this.setEstadoRuta('Ruta limpiada.');
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

        if (this.el.botonCargarMapa && this.el.inputMapaArchivo && this.el.estadoMapa) {
            this.el.botonCargarMapa.addEventListener('click', () => {
                this.el.inputMapaArchivo.click();
            });

            this.el.inputMapaArchivo.addEventListener('change', async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const text = await file.text();
                const result = this._parseMapaTexto(text);

                if (result.exito) {
                    this.mapaTexto = text;
                    this.mapaGrid = result.grid;
                    this.el.estadoMapa.textContent = `Mapa cargado (${result.ancho}x${result.alto})`;
                    this.el.estadoMapa.classList.remove('error');
                } else {
                    this.mapaTexto = null;
                    this.mapaGrid = null;
                    this.el.estadoMapa.textContent = `Error: ${result.mensaje}`;
                    this.el.estadoMapa.classList.add('error');
                }

                // Limpiar selección para permitir recargar el mismo archivo
                event.target.value = '';
            });
        }

        if (this.el.inputRegion) {
            this.el.inputRegion.addEventListener('change', () => {
                this._updateRegionInputs();
            });
        }

        if (this.el.inputDepartamento) {
            this.el.inputDepartamento.addEventListener('change', () => {
                this._populateMunicipios(this.el.inputDepartamento.value);
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
                    console.log(`Construcción seleccionada: ${tipo}`);

                    // Si ya hay celda seleccionada, aplicar construcción directa para mejor experiencia UX
                    if (this.selectedCell && this.onConstruir) {
                        console.log(`Intentando construir ${tipo} en (${this.selectedCell.x}, ${this.selectedCell.y})`);
                        this.onConstruir(this.selectedCell, this.selectedTipo);
                    }
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
        if (!this.el.inputRegion || !this.el.regionCustom || !this.el.regionColombia) return;

        const value = this.el.inputRegion.value;
        const isCustom = value === 'custom';
        const isColombia = value === 'colombia';

        this.el.regionCustom.classList.toggle('hidden', !isCustom);
        this.el.regionColombia.classList.toggle('hidden', !isColombia);

        if (isColombia && this.el.inputDepartamento?.value) {
            this._populateMunicipios(this.el.inputDepartamento.value);
        }
    }

    _populateMunicipios(departamento) {
        if (!this.el.inputMunicipio || !departamento) return;

        const municipios = this.colombiaMunicipios[departamento] || {};
        this.el.inputMunicipio.innerHTML = '<option value="">Selecciona municipio</option>';

        Object.keys(municipios).forEach(mun => {
            const option = document.createElement('option');
            option.value = mun;
            option.textContent = mun;
            this.el.inputMunicipio.appendChild(option);
        });
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
        if (regionKey === 'colombia') {
            const departamento = this.el.inputDepartamento?.value;
            const municipio = this.el.inputMunicipio?.value;

            if (!departamento || !municipio) {
                alert('Selecciona departamento y municipio en Colombia.');
                return null;
            }

            const coordenadas = this.colombiaMunicipios[departamento]?.[municipio];
            if (!coordenadas) {
                alert('No se encontraron coordenadas para el municipio seleccionado.');
                return null;
            }

            region = {
                nombre: `${municipio}, ${departamento}`,
                coordenadas
            };
        }

        if (regionKey === 'custom') {
            const lat = parseFloat(this.el.inputLat?.value);
            const lon = parseFloat(this.el.inputLon?.value);
            if (Number.isNaN(lat) || Number.isNaN(lon)) {
                alert('Ingresa latitud y longitud válidas.');
                return null;
            }
            region = { nombre: 'Personalizada', coordenadas: { lat, lon } };
        }

        return {
            nombre,
            alcalde,
            region,
            tamano,
            mapaTexto: this.mapaTexto,
            mapaGrid: this.mapaGrid
        };
    }

    _parseMapaTexto(text) {
        if (!text || typeof text !== 'string') {
            return { exito: false, mensaje: 'Texto de mapa inválido.' };
        }

        const lines = text.split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            return { exito: false, mensaje: 'El archivo está vacío.' };
        }

        const tokenPattern = /(R[12]|C[12]|I[12]|S[123]|U[12]|P1|r|g)/g;
        const grid = lines.map(line => {
            const tokens = [...line.matchAll(tokenPattern)].map(m => m[0]);
            return tokens;
        }).filter(row => row.length > 0);

        if (grid.length === 0) {
            return { exito: false, mensaje: 'No se detectaron celdas válidas en el archivo.' };
        }

        const alto = grid.length;
        const ancho = Math.max(...grid.map(row => row.length));

        if (alto < 15 || alto > 30 || ancho < 15 || ancho > 30) {
            return {
                exito: false,
                mensaje: `Dimensiones inválidas: ${ancho}x${alto}. Debe ser entre 15x15 y 30x30.`
            };
        }

        // Completar filas cortas con terreno vacío
        const gridPadded = grid.map(row => {
            if (row.length < ancho) {
                return [...row, ...Array(ancho - row.length).fill('g')];
            }
            return row;
        });

        // Validar tipos permitidos
        for (const row of gridPadded) {
            for (const token of row) {
                if (!Mapa.esTipoValido(token)) {
                    return { exito: false, mensaje: `Tipo de celda inválido: '${token}'.` };
                }
            }
        }

        return { exito: true, grid: gridPadded, ancho, alto };
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

        const tipoSelectedEl = document.getElementById('tipo-seleccionado');
        if (tipoSelectedEl) {
            tipoSelectedEl.textContent = this.selectedTipo || 'r';
        }
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

                if (this.routeCells.some((routeCell) => routeCell.x === x && routeCell.y === y)) {
                    cell.classList.add('map-cell--route');
                }

                if (this.routeWalkerCell && this.routeWalkerCell.x === x && this.routeWalkerCell.y === y) {
                    cell.classList.add('map-cell--walker');
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

    renderOpcionesRuta(edificios = []) {
        if (!this.el.selectRutaOrigen || !this.el.selectRutaDestino) return;

        const renderOptions = (selectEl, selectedValue) => {
            selectEl.innerHTML = '<option value="">Selecciona</option>';
            edificios.forEach((edificio) => {
                const option = document.createElement('option');
                option.value = edificio.id;
                option.textContent = `${edificio.tipo} [${edificio.id}] (${edificio.x},${edificio.y})`;
                if (String(edificio.id) === String(selectedValue)) {
                    option.selected = true;
                }
                selectEl.appendChild(option);
            });
        };

        renderOptions(this.el.selectRutaOrigen, this.el.selectRutaOrigen.value);
        renderOptions(this.el.selectRutaDestino, this.el.selectRutaDestino.value);
    }

    aplicarRuta(ruta = []) {
        this.routeCells = Array.isArray(ruta) ? ruta : [];
        this.routeWalkerCell = this.routeCells.length > 0 ? this.routeCells[0] : null;
        if (this._lastRenderedMatrix) {
            this.renderizarMapa(this._lastRenderedMatrix);
        }
    }

    async animarRuta(ruta = [], stepMs = 180) {
        this.routeAnimationToken += 1;
        const token = this.routeAnimationToken;

        this.aplicarRuta(ruta);
        if (!Array.isArray(ruta) || ruta.length === 0) return;

        for (let i = 0; i < ruta.length; i++) {
            if (token !== this.routeAnimationToken) return;

            this.routeWalkerCell = ruta[i];
            if (this._lastRenderedMatrix) {
                this.renderizarMapa(this._lastRenderedMatrix);
            }

            await new Promise((resolve) => setTimeout(resolve, stepMs));
        }
    }

    limpiarRuta() {
        this.routeAnimationToken += 1;
        this.routeCells = [];
        this.routeWalkerCell = null;
        if (this._lastRenderedMatrix) {
            this.renderizarMapa(this._lastRenderedMatrix);
        }
    }

    setEstadoRuta(mensaje, esError = false) {
        if (!this.el.estadoRuta) return;
        this.el.estadoRuta.textContent = mensaje;
        this.el.estadoRuta.classList.toggle('error', Boolean(esError));
    }
}
