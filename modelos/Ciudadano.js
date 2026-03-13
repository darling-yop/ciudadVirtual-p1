class Ciudadano {
    constructor(id, name, username, email) {
        // Atributos base solicitados
        this.id = id || null;
        this.name = name || "";
        this.username = username || "";
        this.email = email || "";

        // Atributos específicos del dominio según la documentación del juego [3, 4]
        this.nivelFelicidad = 50; // Rango 0-100, inicia en un valor neutro [3]
        this.estadoVivienda = false; // Indica si tiene casa asignada [3, 5]
        this.estadoEmpleo = false; // Indica si tiene trabajo asignado [3, 5]
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

    // Actualizar nivel de felicidad basado en necesidades
    actualizarFelicidad() {
        let cambioFelicidad = 0;

        // Bonus si tiene vivienda (especificación: +20 / -20)
        if (this.estadoVivienda) {
            cambioFelicidad += 20;
        } else {
            cambioFelicidad -= 20;
        }

        // Bonus si tiene empleo (especificación: +15 / -15)
        if (this.estadoEmpleo) {
            cambioFelicidad += 15;
        } else {
            cambioFelicidad -= 15;
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
            estadoEmpleo: this.estadoEmpleo
        };
    }
}