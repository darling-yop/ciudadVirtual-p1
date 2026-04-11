# Documentación de Ciudad Virtual

## Resumen Ejecutivo

Este documento consolida la validación técnica y la arquitectura de los dos sistemas clave de la aplicación: el sistema de cálculo de rutas y el sistema de ciudadanos.

### Estado actual
- **Sistema de rutas:** implementado y funcional.
- **Sistema de ciudadanos:** implementado y funcional.
- **Backend Flask:** en ejecución en `http://127.0.0.1:5000`.
- **Estructura de documentación:** agrupada y reducida a un solo archivo de referencia.

---

## 1. Sistema de Cálculo de Rutas

### 1.1 Propósito
Permitir al jugador calcular la ruta más corta entre dos edificios de la ciudad usando vías conectadas.

### 1.2 Componentes principales

#### Frontend
- `acceso_datos/RouteRepository.js`
  - Cliente HTTP responsable de enviar el mapa al backend.
  - Convierte la matriz de tipos a una matriz binaria de transitabilidad.
  - Convierte coordenadas frontend `(x,y)` a backend `[fila, columna]`.
  - Procesa la respuesta del backend y devuelve la ruta en formato `{x, y}`.

- `modelos/Alcalde.js`
  - Método `planificarRuta(idEdificioOrigen, idEdificioDestino)`.
  - Valida existencia de edificios, coordenadas válidas, que no sean el mismo edificio y que haya una ruta.
  - Llama a `RouteRepository.calculateRoute()`.

- `negocio/app.js`
  - Método `calcularRuta(idOrigen, idDestino)`.
  - Orquesta la llamada al manager y la visualización de la ruta.

- `negocio/viewController.js`
  - Rellena los dropdowns de origen y destino.
  - Anima la ruta con `animarRuta()`.
  - Limpia la ruta con `limpiarRuta()`.
  - Muestra mensajes con `setEstadoRuta()`.

- `presentacion/vistas/game.html`
  - UI con selectores `ruta-origen`, `ruta-destino` y botones `boton-calcular-ruta` / `boton-limpiar-ruta`.

#### Backend
- `ms_smart_city-main/main.py`
  - Servidor Flask con CORS habilitado.
  - Endpoint POST `/api/calculate-route`.
  - Algoritmo Dijkstra que retorna la ruta más corta.
  - Valida que origen y destino tengan acceso a vías.

### 1.3 Flujo de trabajo
1. Usuario selecciona edificios origen y destino.
2. Se dispara el evento en `viewController`.
3. `app.calcularRuta()` valida los IDs.
4. `CityManager.planificarRuta()` delega a `Alcalde.planificarRuta()`.
5. `RouteRepository.calculateRoute()` envía petición al backend.
6. Flask calcula la ruta con Dijkstra.
7. La respuesta llega al frontend y se anima en el mapa.

### 1.4 Validaciones críticas
- El edifcio de origen y destino deben existir.
- No pueden ser el mismo edificio.
- Las coordenadas deben ser válidas en el mapa.
- El backend debe estar disponible en `http://127.0.0.1:5000`.
- Debe existir una conexión de vías entre origen y destino.

### 1.5 Estado de implementación
- Backend funcionando ✅
- Cliente HTTP implementado ✅
- Lógica de negocio implementada ✅
- UI y animación presentes ✅
- Manejo de errores completo ✅

---

## 2. Sistema de Ciudadanos

### 2.1 Propósito
Simular la creación, asignación y felicidad de ciudadanos en base a vivienda, empleo, alimentos, clima y servicios.

### 2.2 Componentes principales

#### Clase Ciudadano
- `modelos/Ciudadano.js`
- Atributos: `id`, `name`, `username`, `email`, `nivelFelicidad`, `estadoVivienda`, `estadoEmpleo`.
- Métodos:
  - `asignarVivienda()` / `desasignarVivienda()`.
  - `asignarEmpleo()` / `desasignarEmpleo()`.
  - `actualizarFelicidad()`.
  - `obtenerEstado()`.

#### Ciudad
- `modelos/Ciudad.js`
- `this.poblacion = []` para guardar ciudadanos.
- `this.crecimiento = { min: 1, max: 3 }` para crear 1-3 ciudadanos por turno.

#### Procesos clave en turno
- `actualizarFelicidadCiudadanos()`.
- `#gestionarCrecimientoPoblacional()`.
- `#asignarAutomaticamente()`.

### 2.3 Reglas de felicidad
- Vivienda: +20 si tiene, -20 si no.
- Empleo: +15 si tiene, -15 si no.
- Servicios/parques: +2 por edificio de tipo `P1`, `S1`, `S2`, `S3`.
- Clima: se aplica un ajuste adicional mediante `#calcularAjusteFelicidadClima()`.
- Alimentos:
  - +5 si suficientes para toda la población.
  - +1 si suficientes para al menos la mitad.
  - -8 si menos de la mitad.
- Limite: la felicidad se restringe a [0, 100].

### 2.4 Crecimiento poblacional
Se crean ciudadanos nuevos cuando:
- `felicidadPromedio > 60`
- existe capacidad de vivienda disponible
- existen empleos libres

La cantidad generada es aleatoria entre 1 y 3, limitada por viviendas y empleos disponibles.

### 2.5 Asignación automática
- Se asigna vivienda a ciudadanos sin vivienda si hay edificios residenciales con capacidad libre.
- Se asigna empleo a ciudadanos sin empleo si hay edificios con puestos libres.
- El proceso ocurre automáticamente cada turno en `#asignarAutomaticamente()`.

### 2.6 Estadísticas y reportes
- `obtenerFelicidadPromedio()` calcula el promedio de la población.
- `obtenerEstadoGeneral()` devuelve totales de población, vivienda, empleo, felicidad y estado de recursos.
- `obtenerEstadisticasCiudad()` calcula tasas de crecimiento, desempleo y ocupación laboral.

### 2.7 Estado de implementación
- Clase Ciudadano implementada ✅
- Creación automática implementada ✅
- Asignación automática implementada ✅
- Felicidad y efectos implementados ✅
- Estadísticas implementadas ✅

---

## 3. Validación Unificada

### Checklist de los dos sistemas
- [x] RouteRepository existe y se comunica con backend.
- [x] Backend Flask responde en `/api/calculate-route`.
- [x] Dijkstra funciona y retorna rutas válidas.
- [x] `Alcalde.planificarRuta()` valida entradas y maneja errores.
- [x] `App.calcularRuta()` orquesta el flujo correctamente.
- [x] `viewController.animarRuta()` visualiza la ruta.
- [x] `Ciudadano.actualizarFelicidad()` aplica todos los bonos.
- [x] `#gestionarCrecimientoPoblacional()` cumple condiciones.
- [x] `#asignarAutomaticamente()` asigna vivienda y empleo.
- [x] `obtenerEstadoGeneral()` reporta población y felicidad.

---

## 4. Conclusión

Los dos sistemas están integrados y funcionando. Este documento unifica la validación técnica y elimina la necesidad de múltiples archivos separados para el mismo contenido.
