class Mapa {

    constructor(ancho, alto) {

        this.ancho = Math.min(Math.max(Number(ancho) || 15, 15), 30);
        this.alto = Math.min(Math.max(Number(alto) || 15, 15), 30);

        this.grid = this.#inicializarGrid();
    }

    #inicializarGrid() {
        return Array.from({ length: this.alto }, () =>
            Array(this.ancho).fill('g')
        );
    }

    esCoordenadaValida(x, y) {
        return x >= 0 && x < this.ancho && y >= 0 && y < this.alto;
    }

    obtenerCelda(x, y) {
        if (!this.esCoordenadaValida(x, y)) return null;
        return this.grid[y][x];
    }

    estaDisponible(x, y) {
        return this.obtenerCelda(x, y) === 'g';
    }

    actualizarCelda(x, y, tipo) {

        if (!this.esCoordenadaValida(x, y)) return false;

        if (tipo !== 'g' && !this.estaDisponible(x, y)) {
            return false;
        }

        this.grid[y][x] = tipo;
        return true;
    }

    demoler(x, y) {

        if (!this.esCoordenadaValida(x, y)) return false;

        this.grid[y][x] = 'g';
        return true;
    }

    obtenerVecinos(x, y) {

        const vecinos = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1]
        ];

        return vecinos.filter(([vx, vy]) =>
            this.esCoordenadaValida(vx, vy)
        );
    }

    exportarMapa() {
        return JSON.parse(JSON.stringify(this.grid));
    }
}

