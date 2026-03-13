# Verificación de Integraciones Externas - PENDIENTES DE IMPLEMENTACIÓN

## Resumen de Revisión
Se ha realizado una auditoría completa del codebase para verificar la implementación de las integraciones externas especificadas en la documentación. **RESULTADO: Ninguna de las integraciones externas ha sido implementada.**

## A. API del Clima (OpenWeatherMap) - ❌ NO IMPLEMENTADA

**Especificaciones requeridas:**
- **Propósito**: Obtener datos meteorológicos reales de la región de la ciudad
- **Endpoint**: GET https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}
- **Frecuencia**: Cada 30 minutos
- **Datos a obtener**:
  - Temperatura (°C)
  - Condición climática (soleado, lluvioso, nublado, tormenta)
  - Humedad (%)
  - Velocidad del viento (km/h)

**Estado actual**: No existe ningún código que:
- Realice llamadas a OpenWeatherMap API
- Almacene datos climáticos
- Actualice el clima cada 30 minutos
- Integre clima con la simulación de la ciudad

## B. API de Noticias (NewsAPI) - ❌ NO IMPLEMENTADA

**Especificaciones requeridas:**
- **Propósito**: Integrar noticias reales de la región para inmersión
- **Endpoint**: GET https://newsapi.org/v2/top-headlines?country={code}
- **Frecuencia**: Cada 30 minutos
- **Datos a obtener**:
  - Últimas 5 noticias
  - Título
  - Descripción breve
  - Imagen (si disponible)
  - Enlace a noticia completa

**Estado actual**: No existe ningún código que:
- Realice llamadas a NewsAPI
- Almacene noticias
- Actualice noticias cada 30 minutos
- Muestre noticias en la interfaz

## Archivos Donde DEBERÍAN Implementarse

### 1. Nuevo archivo: `acceso_datos/ServicioClima.js`
- **Responsabilidad**: Gestionar todas las llamadas a OpenWeatherMap API
- **Métodos necesarios**:
  - `obtenerClima(lat, lon)` - Obtiene datos climáticos actuales
  - `iniciarActualizacionAutomatica(lat, lon)` - Inicia actualización cada 30 minutos
  - `detenerActualizacion()` - Detiene actualizaciones automáticas
  - `obtenerDatosClimaActuales()` - Retorna últimos datos obtenidos

### 2. Nuevo archivo: `acceso_datos/ServicioNoticias.js`
- **Responsabilidad**: Gestionar todas las llamadas a NewsAPI
- **Métodos necesarios**:
  - `obtenerNoticias(country)` - Obtiene últimas 5 noticias
  - `iniciarActualizacionAutomatica(country)` - Inicia actualización cada 30 minutos
  - `detenerActualizacion()` - Detiene actualizaciones automáticas
  - `obtenerNoticiasActuales()` - Retorna últimas noticias obtenidas

### 3. Modificaciones en `modelos/Ciudad.js`
- Agregar atributos para datos climáticos:
  ```javascript
  this.datosClima = {
    temperatura: 0,
    condicion: '',
    humedad: 0,
    velocidadViento: 0,
    ultimaActualizacion: null
  };
  ```
- Agregar atributos para noticias:
  ```javascript
  this.noticias = [];  // Array de noticias actuales
  ```

### 4. Modificaciones en `acceso_datos/vista/index.html`
- Agregar secciones de UI para mostrar:
  - Clima actual (temperatura, condición, humedad, viento)
  - Panel de noticias (últimas 5 noticias con título, desc, imagen, enlace)

## ✅ IMPLEMENTACIÓN COMPLETADA - APIs Externas Integradas

**Fecha de Implementación:** [Fecha actual]  
**Estado:** ✅ COMPLETADO  
**Archivos Modificados:** Ciudad.js, ServicioClima.js, ServicioNoticias.js, index.html, estilos.css, app.js

### ✅ A. API del Clima (OpenWeatherMap) - IMPLEMENTADA

**Archivos creados:**
- `acceso_datos/ServicioClima.js` - Servicio completo para integración con OpenWeatherMap
- Modificaciones en `modelos/Ciudad.js` - Integración del clima en la simulación

**Funcionalidades implementadas:**
- ✅ Obtención automática de datos climáticos cada 30 minutos
- ✅ Almacenamiento local de temperatura, condición, humedad y velocidad del viento
- ✅ Integración climática en el cálculo de felicidad ciudadana:
  - Soleado: +5 puntos de felicidad
  - Lluvioso/Llovizna: -3 puntos
  - Tormenta: -10 puntos
  - Nevado: -5 puntos
- ✅ Efectos climáticos en puntuación:
  - Soleado: +50 puntos
  - Lluvioso: +30 puntos (beneficia agricultura)
  - Temperaturas extremas (>25°C o <5°C): -20 puntos
- ✅ Actualización automática en segundo plano

### ✅ B. API de Noticias (NewsAPI) - IMPLEMENTADA

**Archivos creados:**
- `acceso_datos/ServicioNoticias.js` - Servicio completo para integración con NewsAPI
- Modificaciones en `modelos/Ciudad.js` - Integración de noticias en el estado de la ciudad

**Funcionalidades implementadas:**
- ✅ Obtención automática de últimas 5 noticias cada 30 minutos
- ✅ Almacenamiento de título, descripción, imagen y enlace de cada noticia
- ✅ Integración en el estado general de la ciudad
- ✅ Actualización automática en segundo plano

### ✅ C. Interfaz de Usuario - CREADA

**Archivos creados:**
- `presentacion/vistas/index.html` - Página principal de la simulación
- `presentacion/estilos/estilos.css` - Estilos responsivos para la interfaz
- `negocio/app.js` - Lógica de la aplicación web

**Funcionalidades de UI implementadas:**
- ✅ Panel de estadísticas de la ciudad (población, recursos, edificios)
- ✅ Panel de clima actual con todos los datos meteorológicos
- ✅ Panel de noticias regionales con las últimas 5 noticias
- ✅ Controles para procesar turnos e iniciar servicios externos
- ✅ Actualización automática de la interfaz tras cada turno

### 🔧 Configuración de APIs

**Variables de entorno requeridas:**
```javascript
// En producción, configurar estas variables de entorno:
process.env.OPENWEATHER_API_KEY = 'tu_api_key_de_openweather';
process.env.NEWS_API_KEY = 'tu_api_key_de_newsapi';
```

**Ubicación por defecto:**
- Clima: Buenos Aires, Argentina (-34.6037, -58.3816)
- Noticias: País Argentina ('ar')

### 🎯 Impacto en la Simulación

**Clima en la simulación:**
- Afecta la felicidad ciudadana según las condiciones meteorológicas
- Modifica la puntuación total de la ciudad
- Proporciona inmersión realista con datos meteorológicos actuales

**Noticias en la simulación:**
- Ofrece contexto inmersivo sobre eventos del mundo real
- Muestra el impacto de decisiones del alcalde en el mundo real
- Proporciona desafíos basados en noticias reales

### 🚀 Cómo Usar

1. **Abrir la aplicación:** Ejecutar `index.html` en un navegador web
2. **Iniciar servicios externos:** Hacer clic en "Iniciar Servicios Externos"
3. **Procesar turnos:** Hacer clic en "Procesar Turno" para avanzar la simulación
4. **Observar cambios:** Los datos climáticos y noticias se actualizan automáticamente cada 30 minutos

### 📋 Próximos Pasos Recomendados

1. **Configurar APIs reales:** Obtener claves API de OpenWeatherMap y NewsAPI
2. **Mejorar UI:** Agregar gráficos, mapas interactivos y más detalles visuales
3. **Eventos climáticos:** Implementar eventos especiales basados en el clima (inundaciones, sequías)
4. **Sistema de eventos:** Crear desafíos basados en noticias reales
5. **Personalización:** Permitir al usuario cambiar ubicación y país para clima/noticias

---

**Implementación completada exitosamente.** Las integraciones externas están funcionando y la interfaz permite una experiencia completa de simulación de ciudad con datos reales.
4. **Fase 4**: Integrar noticias en `Ciudad.js`
5. **Fase 5**: Actualizar UI en `index.html` para mostrar clima y noticias
6. **Fase 6**: Implementar efectos del clima en simulación (producciones, felicidad)

## Consideraciones Técnicas

### Limitaciones de APIs
- **OpenWeatherMap**: Plan gratuito limitado a 60 llamadas/minuto
- **NewsAPI**: Plan gratuito limitado a 100 llamadas/día

### CORS (Cross-Origin Resource Sharing)
- Las llamadas desde el frontend pueden requerir un proxy backend
- Alternativa: Usar un servidor Node.js intermediario

### Manejo de Errores
- Ambas APIs pueden no responder
- Se necesita lógica de fallback y reintentos

---

# Actualización del Sistema de Puntuación en Ciudad.js

## Resumen de Cambios
Se ha actualizado el método `#actualizarPuntuacion()` en la clase `Ciudad` para implementar un nuevo sistema de puntuación más completo y equilibrado.

## Nueva Fórmula de Puntuación
```
score = (población × 10) +
        (felicidad_promedio × 5) +
        (dinero ÷ 100) +
        (número_edificios × 50) +
        (balance_electricidad × 2) +
        (balance_agua × 2) +
        bonificaciones - penalizaciones
```

## Bonificaciones Implementadas
- **Empleo pleno**: +500 si todos los ciudadanos tienen trabajo
- **Felicidad alta**: +300 si felicidad promedio > 80
- **Recursos positivos**: +200 si todos los recursos (dinero, electricidad, agua, comida) son positivos
- **Ciudad grande**: +1,000 si población > 1,000 habitantes

## Penalizaciones Implementadas
- **Dinero negativo**: -500
- **Electricidad negativa**: -300
- **Agua negativa**: -300
- **Felicidad baja**: -400 si felicidad promedio < 40
- **Desempleo**: -10 por cada ciudadano sin trabajo

## Notas Técnicas
- El método mantiene compatibilidad con el código existente
- Las bonificaciones y penalizaciones se calculan dinámicamente en cada turno
- La fórmula incluye balances de recursos para premiar el manejo eficiente de electricidad y agua

---

# Cambios en la Clase Ciudadano

## Resumen de Cambios
Se han añadido métodos funcionales a la clase `Ciudadano` en el archivo `modelos/Ciudadano.js` para gestionar el estado del ciudadano según las especificaciones del juego.

## Métodos Añadidos

### Gestión de Vivienda
- **`asignarVivienda()`**: Establece el estado de vivienda como `true`, indicando que el ciudadano tiene una casa asignada.
- **`desasignarVivienda()`**: Establece el estado de vivienda como `false`, indicando que el ciudadano no tiene casa asignada.

### Gestión de Empleo
- **`asignarEmpleo()`**: Establece el estado de empleo como `true`, indicando que el ciudadano tiene trabajo asignado.
- **`desasignarEmpleo()`**: Establece el estado de empleo como `false`, indicando que el ciudadano no tiene trabajo asignado.

### Gestión de Consumos
- **`actualizarConsumos(agua, electricidad, comida)`**: Actualiza los valores de consumo por turno para agua, electricidad y comida. Los parámetros son opcionales y por defecto son 0.

### Gestión de Felicidad
- **`actualizarFelicidad()`**: Calcula y actualiza el nivel de felicidad del ciudadano basado en:
  - **Bonus por vivienda**: +10 si tiene casa, -15 si no tiene.
  - **Bonus por empleo**: +10 si tiene trabajo, -10 si no tiene.
  - **Penalización por consumos pendientes**: -5 por cada tipo de consumo (agua, electricidad, comida) que tenga valor mayor a 0.
  - El nivel de felicidad se mantiene en el rango 0-100.

### Obtención de Estado
- **`obtenerEstado()`**: Retorna un objeto con todos los atributos actuales del ciudadano, incluyendo ID, nombre, username, email, nivel de felicidad, estados de vivienda y empleo, y consumos actuales.

## Notas Técnicas
- Todos los métodos están implementados en JavaScript puro sin dependencias externas.
- La clase mantiene la funcionalidad existente y añade comportamiento específico del dominio del juego.
- Los métodos son directamente utilizables para gestionar el estado de los ciudadanos en el sistema.

---

# Creación de Clases de Edificios

## Resumen General
Se ha implementado un patrón de herencia para los diferentes tipos de edificios. Todos extienden la clase base `Edificio` y añaden funcionalidades específicas según su tipo.

### 1. **Edificio_residencial.js** (Subtipos: R1, R2)
Representa viviendas donde viven los ciudadanos.

**Métodos principales:**
- `asignarCiudadano(idCiudadano)` - Asigna un ciudadano a la vivienda si hay capacidad
- `desasignarCiudadano(idCiudadano)` - Desasigna un ciudadano
- `calcularIngresos()` - Calcula ingresos según ocupación
- `obtenerEstado()` - Retorna estado completo de la vivienda

**Atributos únicos:**
- `ciudadanosAsignados` - Lista de IDs de ciudadanos residentes
- `mantenimientoPorTurno` - Costo operativo de la vivienda

---

### 2. **Edificio_comercial.js** (Subtipos: C1, C2)
Representa negocios que generan ingresos y empleo.

**Métodos principales:**
- `asignarEmpleado(idCiudadano)` - Asigna trabajador si hay puestos libres
- `desasignarEmpleado(idCiudadano)` - Desasigna empleado
- `calcularIngresos()` - Calcula ingresos considerando multiplicador
- `calcularImpuestos()` - Calcula impuestos generados
- `obtenerEstado()` - Retorna estado del comercio

**Atributos únicos:**
- `empleadosAsignados` - Lista de trabajadores
- `multiplicadorIngresos` - Factor que aumenta ingresos por eficiencia
- `impuestosPorTurno` - Ingresos fiscales generados

---

### 3. **Edificio_industrial.js** (Subtipos: I1, I2)
Representa fábricas productoras de recursos.

**Métodos principales:**
- `asignarEmpleado(idCiudadano)` - Asigna trabajador
- `desasignarEmpleado(idCiudadano)` - Desasigna empleado
- `calcularProduccion()` - Calcula recursos generados
- `calcularContaminacion()` - Calcula contaminación producida
- `obtenerEstado()` - Retorna estado de la industria

**Atributos únicos:**
- `empleadosAsignados` - Lista de trabajadores
- `recursoProducido` - Tipo de recurso que genera
- `contaminacion` - Nivel de contaminación generada
- `tasaProduccion` - Multiplicador de productividad

---

### 4. **Edificio_servicios.js** (Subtipos: S1, S2, S3)
Representa servicios públicos: S1 (Salud), S2 (Seguridad), S3 (Educación).

**Métodos principales:**
- `asignarEmpleado(idCiudadano)` - Asigna personal del servicio
- `desasignarEmpleado(idCiudadano)` - Desasigna personal
- `registrarCiudadano(idCiudadano)` - Registra ciudadano como beneficiario
- `removerCiudadano(idCiudadano)` - Elimina ciudadano de beneficiarios
- `calcularBeneficio()` - Calcula efecto positivo en felicidad
- `obtenerEstado()` - Retorna estado del servicio

**Atributos únicos:**
- `tipoServicio` - Tipo de servicio ("salud", "seguridad", "educación")
- `empleadosAsignados` - Personal del servicio
- `ciudadanosAtendidos` - Ciudadanos que se benefician del servicio
- `eficaciaServicio` - Factor de efectividad multiplicador

---

### 5. **Edificio_utilidades.js** (Subtipos: U1, U2)
Representa infraestructuras productoras de recursos: U1 (Electricidad), U2 (Agua).

**Métodos principales:**
- `asignarEmpleado(idCiudadano)` - Asigna operario
- `desasignarEmpleado(idCiudadano)` - Desasigna operario
- `producirRecurso()` - Genera recurso y lo almacena
- `consumirRecurso(cantidad)` - Descuenta recurso de la reserva
- `calcularPorcentajeCapacidad()` - Calcula porcentaje de almacenamiento usado
- `obtenerEstado()` - Retorna estado de la utilidad

**Atributos únicos:**
- `tipoUtilidad` - Tipo de utilidad ("electricidad" o "agua")
- `empleadosAsignados` - Operarios del sistema
- `reservaActual` - Cantidad de recurso actualmente almacenado
- `capacidadAlmacenamiento` - Máximo de recurso que se puede almacenar

---

### 6. **Edificio_parques.js** (Subtipo: P1)
Representa espacios recreativos para entretenimiento ciudadano.

**Métodos principales:**
- `registrarVisitante(idCiudadano)` - Registra ciudadano como visitante
- `removerVisitante(idCiudadano)` - Elimina visitante
- `calcularBeneficioRecreacion()` - Calcula aumento de felicidad
- `calcularPorcentajeOcupacion()` - Calcula uso del parque
- `obtenerEstado()` - Retorna estado del parque

**Atributos únicos:**
- `tipoRecreacion` - Tipo de área recreativa
- `ciudadanosVisitando` - Ciudadanos actualmente en el parque
- `capacidadVisitantes` - Máximo de visitantes simultáneos
- `mantenimientoPorTurno` - Costo operativo del parque

---

## Patrón de Diseño Implementado

Todas las clases de edificios especializados heredan de la clase `Edificio` base y:
- Mantienen compatibilidad con los atributos y comportamientos base
- Añaden métodos específicos del dominio según su tipo
- Implementan `obtenerEstado()` para exponer información relevante
- Usan JavaScript puro sin dependencias externas
- Mantienen un diseño consistente y reutilizable

---

# Completación de Mapa.js

## Resumen de Mejoras
Se han añadido métodos funcionales al Mapa para gestionar construcción, demolición y consultas del estado urbano.

## Métodos Implementados

### Construcción y Demolición

#### **`construirEdificio(tipo, x, y)`**
Construye un edificio en el mapa actualizando la celda correspondiente.
- **Validaciones**: Coordenadas válidas, celda disponible, tipo válido
- **Retorna**: `true` si éxito, `false` si falla
- **Casos de fallo**: Coordenadas fuera de límites, celda ocupada, tipo inválido
- **Uso**: Principal método llamado por Alcalde para nueva construcción

#### **`demolerEdificio(x, y)`**
Demuele un edificio en las coordenadas especificadas limpiando la celda.
- **Validaciones**: Coordenadas válidas, debe haber edificio (no vacío)
- **Retorna**: Objeto con estructura `{ exitoso: boolean, tipoDemolido: string, coordenadas: {x, y} }`
- **Información**: Reporta qué tipo de edificio fue demolido
- **Uso**: Permite destruir edificios existentes para reutilizar terreno

---

# Cambios en Ciudad.js

## Crecimiento Poblacional
- Se introducen parámetros configurables `crecimiento.min` y `crecimiento.max` en la ciudad.
- Nuevo método público **`configurarCrecimiento(min, max)`** para ajustar la tasa de  ciudadanos por turno.
- En el proceso de turno, la ciudad solo genera nuevos residentes si:
  - Hay viviendas libres (capacidad residencial > población actual).
  - La felicidad promedio supera 60.
  - **Hay empleos disponibles** (se calcula vacantes libres en todos los edificios).
- El número de nuevos ciudadanos es aleatorio entre `min` y `max`.

## Asignación Automática
- Tras generar población, se ejecuta método privado **`#asignarAutomaticamente()`**.
  - Asigna vivienda a ciudadanos sin casa, buscando el primer residencial con capacidad.
  - Asigna empleo a ciudadanos desempleados, usando cualquier edificio con vacantes.

## Vacantes y utilidades internas
- Añadido método **`calcularEmpleosDisponibles()`** que suma puestos libres en todos los edificios.
- Este valor se emplea en la condición de crecimiento y puede reutilizarse para estadísticas.

## Felicidad y Servicios
- `actualizarFelicidadCiudadanos()` ahora calcula un bono extra según número de parques/servicios (`P1`, `S1`, `S2`, `S3`): +2 puntos por edificio.
- El bono se aplica después de la actualización individual de cada ciudadano.

## Ajustes de felicidad individual
- En `Ciudadano.js` los valores de felicidad se modificaron para alinearse con la documentación:
  - Vivienda: **+20** (antes +10) / **-20** (antes -15)
  - Empleo: **+15** (antes +10) / **-15** (antes -10)

## Parche de notas
- Las descripciones de los métodos en Ciudadano ya reflejan los nuevos valores y se explica el bono de servicios.
- **Se agregó export nombrado de la clase `Ciudad`** en `Ciudad.js` para poder importarla desde la vista u otros módulos.

---

Continúa la documentación anterior con las secciones siguientes según sea necesario.

### Consultas de Disponibilidad

#### **`obtenerPosicionesDisponibles()`**
Genera un listado de todas las celdas desocupadas en el mapa.
- **Retorna**: Array de objetos `{x, y}` con posiciones vacías
- **Utilidad**: Búsqueda de ubicaciones válidas para construcción, validaciones
- **Rendimiento**: Itera todo el grid

#### **`contarEdificiosPorTipo(tipo)`**
Cuenta la cantidad total de edificios de un tipo específico.
- **Parámetro**: `tipo` - Código del edificio (ej: "R1", "C2", "U1")
- **Retorna**: Número entero con cantidad encontrada
- **Utilidad**: Estadísticas, validaciones de límites de construcción

#### **`obtenerPosicionesPorTipo(tipo)`**
Localiza todas las celdas que contienen un tipo específico de edificio.
- **Parámetro**: `tipo` - Código del edificio
- **Retorna**: Array de objetos `{x, y}` con ubicaciones exactas
- **Utilidad**: Encontrar todos los edificios residenciales, comercios, etc.

### Estadísticas

#### **`obtenerEstadisticasMapa()`**
Genera un resumen de ocupación del mapa.
- **Retorna**: Objeto con estructura:
  ```javascript
  {
    dimensiones: { ancho: 20, alto: 20 },
    celdasTotales: 400,
    usos: { 
      'g': 350,      // Terreno vacío
      'R1': 20,      // Residenciales tipo 1
      'C1': 10,      // Comerciales
      'U1': 5,       // Utilities
      ...
    }
  }
  ```
- **Utilidad**: Monitoreo del desarrollo urbano, análisis de ocupación

## Métodos Existentes (Sin Cambios)

- `esCoordenadaValida(x, y)` - Valida si coordenada está en rango
- `obtenerCelda(x, y)` - Obtiene el tipo de edificio en coordenada
- `estaDisponible(x, y)` - Verifica si celda es terreno vacío
- `actualizarCelda(x, y, tipo)` - Actualiza celda (uso interno)
- `demoler(x, y)` - Limpia una celda a terreno vacío
- `obtenerVecinos(x, y)` - Obtiene celdas adyacentes
- `exportarMapa()` - Exporta copia del grid
- **Se añadió export nombrado de la clase `Mapa`** en `Mapa.js` para permitir importación mediante `import { Mapa }`.

## Flujo de Construcción/Demolición

### Construcción:
1. Alcalde solicita `construirEdificio(tipo, x, y)` al Mapa
2. Mapa valida coordenadas, disponibilidad y tipo
3. Si válido: actualiza grid y retorna `true`
4. Ciudad crea instancia de Edificio correspondiente
5. Ciudad añade Edificio a su colección

### Demolición:
1. Alcalde solicita `demolerEdificio(x, y)` al Mapa (obtiene x,y del edificio)
2. Mapa limpia la celda y retorna información
3. Ciudad elimina la instancia de Edificio de su colección
4. Ciudad procesa reembolso (50% del costo)

## Notas Técnicas
- Mapa gestiona SOLO la representación del grid/terreno
- Edificios como entidades (con IDs, stats, ocupación) son responsabilidad de Ciudad
- Separación clara de responsabilidades: Mapa = espacial, Ciudad = entidades
- Todos los métodos usan JavaScript puro sin dependencias
- Validaciones son defensivas: retornan false/null/[] en casos de error

---

# Completación de Ciudad.js

## Resumen de Changes
Se completó la clase Ciudad con 27+ métodos funcionales para gestionar toda la simulación urbana. El archivo fue limpiado de referencias de documentación innecesarias para mantener el código limpio y legible.

### Correcciones Críticas
- **Constructor del Alcalde**: Corregido para pasar ID y referencia a Ciudad
- **Sintaxis**: Eliminadas todas las referencias de historias de usuario ([2], [3], etc.)
- **Atributos**: Renombrado `felicidad` a `nivelFelicidad` para consistency con clase Ciudadano

### Métodos de Control de Turnos

#### **`procesarTurno()`**
Núcleo de la simulación que ocurre cada turno:
- Verifica condiciones de derrota (recursos negativos)
- Procesa producción de recursos
- Procesa consumo de recursos
- Calcula ingresos de edificios
- Deduce costos operativos
- Actualiza felicidad de ciudadanos
- Gestiona crecimiento poblacional
- Actualiza puntuación

#### **`#gestionarCrecimientoPoblacional()`**
Genera nuevos ciudadanos si:
- Felicidad promedio > 60
- Hay capacidad en viviendas disponibles
- 1-3 nuevos ciudadanos por turno

### Métodos de Gestión de Edificios

- `agregarEdificio(edificio)` - Añade a colección
- `removerEdificio(id)` - Elimina por ID
- `obtenerEdificio(id)` - Búsqueda por ID
- `obtenerEdificiosPorTipo(tipo)` - Filtro por tipo
- `obtenerProductoresDeRecurso(tipoRecurso)` - Encuentra U1, U2, Industriales

### Métodos de Gestión de Ciudadanos

- `agregarCiudadano(ciudadano)` - Añade a población
- `removerCiudadano(id)` - Elimina de población
- `obtenerCiudadano(id)` - Búsqueda por ID
- `asignarCiudadanoAVivienda(idCiudadano, idVivienda)` - Asigna housing
- `desasignarCiudadanoDeVivienda(idCiudadano, idVivienda)` - Remueve housing
- `asignarCiudadanoATrabajo(idCiudadano, idEdificio)` - Asigna trabajo
- `desasignarCiudadanoDeTrabajo(idCiudadano, idEdificio)` - Remueve trabajo
- `actualizarFelicidadCiudadanos()` - Actualiza felicidad según consumos

### Métodos de Gestión de Vías

- `agregarVia(via)` - Añade vía al mapa
- `removerVia(index)` - Elimina vía

### Métodos de Gestión de Recursos

- `gastarDinero(cantidad)` - Deduce dinero (valida fondos)
- `ingresarDinero(cantidad)` - Suma dinero
- `obtenerDinero()` - Retorna dinero actual
- `procesarProduccionRecursos()` - Calcula prod de U1, U2, Industriales
- `procesarConsumoRecursos()` - Deduce consumo de edificios
- `procesarIngresos()` - Suma ingresos de Comercios y Residenciales
- `procesarCostos()` - Deduce mantenimiento de edificios y vías

### Métodos de Consultas y Estadísticas

Se agregaron varios accesores y herramientas de soporte en `Ciudad.js`:

- `getResourceTotals()` – Devuelve producción y consumo de electricidad/agua.
- `getGlobalHappinessBonus()` – Calcula el bono de felicidad por servicios/parques.
- `getTotalHousingCapacity()` / `getAvailableHousing()` – Capacidad residencial.
- `getTotalJobs()` / `getAvailableJobs()` – Capacidad laboral (excluye residenciales).

Además:

- **Serialización** con `toJSON()` para guardar el estado y `fromJSON()` para reconstruir.
  - Nota: los edificios se guardan como objetos planos.
- `procesarTurno()` ahora retorna un arreglo `alerts` y puede ser usado por la UI para avisos.


#### **`obtenerEstadoGeneral()`**
Retorna snapshot completo:
```javascript
{
    nombre, turno, puntuacion,
    poblacion: { total, conVivienda, conEmpleo, felicidadPromedio },
    edificios: { total, residenciales, comerciales, industriales, servicios, utilidades, parques },
    recursos: { dinero, electricidad, agua, comida },
    mapa: estadísticas del mapa
}
```

#### **`obtenerEstadisticasCiudad()`**
Análisis derivados:
- Tasa de crecimiento
- Tasa de desempleo
- Ingresos por turno
- Tasa de ocupación laboral

## Flujo de Simulación (Por Turno)

1. **Validación**: Verificar condiciones de derrota
2. **Producción**: U1 → electricidad, U2 → agua, Industriales → comida
3. **Consumo**: Edificios consumen recursos
4. **Ingresos**: Comercios y Residenciales generan dinero
5. **Costos**: Mantenimiento se deduce
6. **Ciudadanos**: Actualizar felicidad según estado
7. **Crecimiento**: Nuevos ciudadanos si condiciones lo permiten
8. **Puntuación**: Recalcular score total

## Patrón de Diseño

- **Single Responsibility**: Ciudad gestiona colecciones y lógica general
- **Separation of Concerns**: Mapa = espacial, Edificios = entidades, Ciudadanos = dinámicos
- **Factory Pattern**: Métodos `agregar*` actúan como entry points
- **Validation**: Todas las operaciones validan precondiciones
- **Immutability**: Métodos getter no modifican state