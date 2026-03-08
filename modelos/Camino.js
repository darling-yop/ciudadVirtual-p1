class Camino {

    constructor(x, y) {

        this.x = Number(x);
        this.y = Number(y);

        this.tipo = 'r';
        this.costoConstruccion = 100;

        this.consumoElectricidad = 0;
        this.consumoAgua = 0;

        this.esTransitable = true;
    }

}