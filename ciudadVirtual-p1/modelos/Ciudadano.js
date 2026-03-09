class Ciudadano {
    constructor(id, name, username, email) {
        // Atributos base solicitados
        this.id = id || null;
        this.name = name || "";
        this.username = username || "hbh";
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
}