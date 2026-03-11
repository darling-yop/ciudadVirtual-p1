class Ciudadano {
    constructor(id, name, username, email) {
        // Atributos base solicitados
        this.id = id || null;
        this.name = name || "";
        this.username = username || "hola";
        this.email = email || "";

        // Atributos específicos del dominio según la documentación del juego [3, 4]
        this.nivelFelicidad = 50; // Rango 0-100, inicia en un valor neutro [3]
        this.estadoVivienda = false; // Indica si tiene casa asignada [3, 5]
        this.estadoEmpleo = false; // Indica si tiene trabajo asignado [3, 5]
        
        // Necesidades básicas de consumo por turno [3]
        this.consumoAgua = 0; 
        this.consumoElectricidad = 0;
        this.consumoComida = 0;
    }

    // Gestión de vivienda
    asignarVivienda() {
        this.estadoVivienda = true;
    }

    desasignarVivienda() {
        this.estadoVivienda = false;
    }

    // Gestión de empleo
    asignarEmpleo() {
        this.estadoEmpleo = true;
    }

    desasignarEmpleo() {
        this.estadoEmpleo = false;
    }

    // Actualizar consumos por turno
    actualizarConsumos(agua, electricidad, comida) {
        this.consumoAgua = agua || 0;
        this.consumoElectricidad = electricidad || 0;
        this.consumoComida = comida || 0;
    }

    // Actualizar nivel de felicidad basado en necesidades
    actualizarFelicidad() {
        let cambioFelicidad = 0;

        // Bonus si tiene vivienda
        if (this.estadoVivienda) {
            cambioFelicidad += 10;
        } else {
            cambioFelicidad -= 15;
        }

        // Bonus si tiene empleo
        if (this.estadoEmpleo) {
            cambioFelicidad += 10;
        } else {
            cambioFelicidad -= 10;
        }

        // Penalidad por consumos no surtidos
        if (this.consumoAgua > 0) {
            cambioFelicidad -= 5;
        }
        if (this.consumoElectricidad > 0) {
            cambioFelicidad -= 5;
        }
        if (this.consumoComida > 0) {
            cambioFelicidad -= 5;
        }

        // Aplicar cambio y mantener rango 0-100
        this.nivelFelicidad += cambioFelicidad;
        this.nivelFelicidad = Math.max(0, Math.min(100, this.nivelFelicidad));
    }

    // Obtener estado actual del ciudadano
    obtenerEstado() {
        return {
            id: this.id,
            name: this.name,
            username: this.username,
            email: this.email,
            nivelFelicidad: this.nivelFelicidad,
            estadoVivienda: this.estadoVivienda,
            estadoEmpleo: this.estadoEmpleo,
            consumoAgua: this.consumoAgua,
            consumoElectricidad: this.consumoElectricidad,
            consumoComida: this.consumoComida
        };
    }
}