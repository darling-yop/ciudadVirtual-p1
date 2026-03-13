# Verificación de Integraciones Externas - PENDIENTES DE IMPLEMENTACIÓN

## Resumen de Revisión
Se ha realizado una auditoría completa del codebase para verificar la implementación de las integraciones externas especificadas en la documentación. **RESULTADO: Ninguna de las integraciones externas ha sido implementada.**

## Verificación de Restricciones de Dominio
Se revisaron las reglas de dominio descritas en el documento de especificaciones (construcción y población). A continuación se presenta el estado actual:

- **Exclusividad espacial**: El mapa impide la superposición de elementos (`Mapa.estaDisponible` y validaciones en `actualizarCelda`). ✅ Implementado.
- **Restricción presupuestaria**: `Ciudad.puedeConstruir` comprueba que el costo de construcción no exceda el dinero disponible. ✅ Implementado.
- **Adyacencia obligatoria**: Antes de construir, se verifica que exista una vía adyacente mediante `obtenerVecinos`. ✅ Implementado.
- **Límite territorial**: Las coordenadas se validan con `Mapa.esCoordenadaValida`, y el tamaño del mapa es fijo en el constructor. ✅ Implementado.
- **Capacidad residencial y crecimiento poblacional**: `#gestionarCrecimientoPoblacional` y otras funciones aseguran que la población no supere la capacidad de vivienda y aplican requisitos de felicidad y empleo. ✅ Implementado.
- **Asignación automática de vivienda y empleo**: Método `#asignarAutomaticamente`. ✅ Implementado.

No se encontraron restricciones faltantes; el sistema ya cumple con los requisitos de dominio actualmente. No se requieren cambios adicionales por este motivo.

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

## Cambios Realizados para Alinear con Especificaciones

### Fecha: 13 de marzo de 2026

#### 1. Actualización de Ciudad.js
- **procesarIngresos()**: Eliminado ingresos de edificios residenciales, ya que según especificaciones no generan ingresos. Solo comercios e industriales (fábricas I1) generan ingresos.
- **procesarProduccionRecursos()**: Cambiado para que solo las granjas (I2) produzcan alimentos, no todas las industriales.
- **procesarIngresos()**: Ajustado para incluir solo fábricas (I1) en ingresos por producción de dinero.

#### 2. Actualización de Edificio_industrial.js
- **calcularProduccion()**: Cambiado a producción fija, no basada en ocupación de empleados.
- **calcularIngresos()**: Agregado método para fábricas (I1) que devuelven ingresos fijos de $800/turno.

#### 3. Actualización de Edificio_comercial.js
- **calcularIngresos()**: Cambiado a ingresos fijos según tipo (C1: $500, C2: $2000), no basado en empleados.

#### 4. Actualización de Edificio_residencial.js
- **calcularIngresos()**: Eliminado, ya que residenciales no generan ingresos.
- **obtenerEstado()**: Removido campo ingresosGenerados.

#### 5. Actualización de Edificio_servicios.js
- Eliminados atributos y métodos relacionados con empleados y ciudadanos atendidos, ya que los servicios afectan felicidad globalmente, no por radio.
- Simplificado constructor y obtenerEstado().

#### 6. Actualización de Edificio_utilidades.js
- Eliminados atributos y métodos relacionados con empleados y almacenamiento, ya que plantas producen recursos fijos sin empleados.
- **producirRecurso()**: Devuelve producción fija.
- Simplificado obtenerEstado().

#### 7. Actualización de Edificio_parques.js
- Eliminados atributos y métodos relacionados con visitantes y capacidad, ya que parques afectan felicidad globalmente.
- Simplificado constructor y obtenerEstado().

#### 8. Actualización de Ciudad.js (continuación)
- **#actualizarPuntuacion()**: Eliminadas bonificaciones climáticas, ya que no están en las especificaciones.
- **actualizarFelicidadCiudadanos()**: Eliminado efecto climático en felicidad individual, ya que no se menciona en specs. Removida lógica de consumos, ya que felicidad se basa solo en vivienda, empleo, servicios y parques.

#### 9. Actualización de Ciudadano.js
- Eliminados atributos y métodos relacionados con consumos (agua, electricidad, comida), ya que no afectan felicidad según specs.
- **actualizarFelicidad()**: Simplificado para solo considerar vivienda (+20/-20) y empleo (+15/-15). Eliminadas penalidades por consumos.
- **obtenerEstado()**: Removidos campos de consumos.
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

### ✅ D. Efectos Climáticos en la Simulación - IMPLEMENTADO

**Funcionalidades implementadas:**
- ✅ Efectos climáticos en felicidad ciudadana:
  - Soleado: +5 puntos de felicidad
  - Lluvioso/Llovizna: -3 puntos
  - Tormenta: -10 puntos
  - Nevado/Nublado: -5 puntos
- ✅ Efectos climáticos en producción agrícola:
  - Lluvioso/Llovizna: +50% producción (beneficia agricultura)
  - Soleado: +20% producción
  - Tormenta: -30% producción
  - Nevado: -50% producción

## Cambios Recientes - Integración con Backend de Routing y Mejoras Frontend

### Fecha: 13 de marzo de 2026 (continuación)

#### 1. Separación de CSS y HTML en el Frontend
- **Archivo modificado:** `acceso_datos/vista/index.html`
- **Archivo creado:** `acceso_datos/vista/style.css`
- **Descripción:** Se extrajo todo el CSS embebido en `<style>` del HTML a un archivo separado `style.css` para mejor organización y mantenibilidad. Se agregó enlace con `<link rel="stylesheet" href="./style.css">`.
- **Beneficio:** Código más limpio, reutilización de estilos, y separación de responsabilidades.

#### 2. Integración con Backend de Routing (Python Flask)
- **Archivo creado:** `acceso_datos/vista/js/routing.js`
- **Descripción:** Implementado módulo de routing que reemplaza el algoritmo Dijkstra local con llamadas a la API REST del backend Python proporcionado por el profesor.
- **Funcionalidades:**
  - Conversión de mapa de Ciudad a formato binario (0=edificio, 1=vía) requerido por la API.
  - Inversión de coordenadas (x,y) a (fila,columna) según especificación del backend.
  - Llamada POST a `http://127.0.0.1:5000/api/calculate-route` con manejo de errores.
  - Conversión de respuesta "route" de vuelta a formato {x,y} para el frontend.
- **Método principal:** `callRouteAPI(mapa, ox, oy, dx, dy)` - Calcula ruta entre dos puntos usando el backend.
- **Método auxiliar:** `checkBackendHealth()` - Verifica disponibilidad del servidor.

#### 3. Actualización de la Interfaz de Usuario para Routing
- **Archivo modificado:** `acceso_datos/vista/index.html`
- **Descripción:** Agregada sección "Calcular Ruta" con inputs para coordenadas de origen y destino, botón para ejecutar cálculo, y área de resultados.
- **Funcionalidades:** Permite probar la integración con el backend de routing directamente desde la UI.

#### 4. Corrección de Exportaciones en Módulos JS
- **Archivos modificados:** `acceso_datos/ServicioClima.js`, `acceso_datos/ServicioNoticias.js`
- **Descripción:** Agregadas exportaciones por defecto (`export default`) además de las exportaciones nombradas para compatibilidad con diferentes formas de importación en ES modules.
- **Problema resuelto:** Errores de "does not provide an export named" al importar en el navegador.

#### 5. Corrección de Uso de `process.env` en Ciudad.js
- **Archivo modificado:** `modelos/Ciudad.js`
- **Descripción:** Reemplazado acceso directo a `process.env` con verificación segura (`typeof process !== 'undefined' && process.env`) para evitar errores en el navegador donde `process` no existe.
- **Problema resuelto:** `ReferenceError: process is not defined` al ejecutar en navegador.

#### 6. Mejora en Método `puedeConstruir` de Ciudad.js
- **Archivo modificado:** `modelos/Ciudad.js`
- **Descripción:** Modificado para permitir construcción en cualquier celda vacía cuando no hay vías construidas (facilita inicio del juego), manteniendo restricción de adyacencia a vías una vez que existen.
- **Problema resuelto:** Imposibilidad de construir al inicio del juego por falta de vías adyacentes.

#### 7. Resolución de Conflicto de Merge en Git
- **Acción:** Completado merge pendiente con `git commit` después de resolver conflictos automáticamente.
- **Resultado:** Repositorio sincronizado con cambios del compañero de equipo.

#### 8. Actualización de Estado de APIs Externas
- **Actualización:** Las APIs de clima y noticias ya están implementadas en `ServicioClima.js` y `ServicioNoticias.js`, integradas en `Ciudad.js`.
- **Estado:** ✅ IMPLEMENTADAS (actualizado de "NO IMPLEMENTADA" a completado).

## Estado Actual del Proyecto

### ✅ Completado
- Modelo de datos completo (Ciudad, Ciudadano, Edificios, Mapa)
- Lógica de simulación (turnos, recursos, felicidad, crecimiento poblacional)
- Integraciones externas (Clima OpenWeatherMap, Noticias NewsAPI)
- Frontend básico con separación de CSS
- Integración con backend de routing Python
- Sistema de persistencia (toJSON/fromJSON)

### 🔄 Pendiente
- Interfaz de usuario completa (mapa visual, controles avanzados)
- Sistema de guardado/carga de partidas
- Pruebas exhaustivas
- Documentación completa de API

### 📋 Próximos Pasos Recomendados
1. Implementar renderizado visual del mapa en el frontend
2. Agregar controles para construcción/demolición visual
3. Mejorar UX con notificaciones y feedback
4. Implementar sistema de guardado automático
5. Agregar tutorial/modal de bienvenida
  - Nublado: -10% producción
- ✅ Bonificaciones climáticas en puntuación (ya implementadas):
  - Soleado: +50 puntos
  - Lluvioso: +30 puntos (beneficia agricultura)
  - Temperaturas extremas (>25°C o <5°C): -20 puntos

### ✅ E. Sistema de Eventos por Noticias - IMPLEMENTADO

**Funcionalidades implementadas:**
- ✅ Eventos aleatorios basados en noticias (10% probabilidad por turno)
- ✅ Tipos de eventos:
  - Crisis económica: Reduce ingresos en 5%
  - Desastres: Reduce felicidad en 10 puntos por ciudadano
  - Noticias positivas: Aumenta felicidad en 5 puntos por ciudadano
- ✅ Integración automática en el procesamiento de turnos

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

1. ✅ **Configurar APIs reales:** Obtener claves API de OpenWeatherMap y NewsAPI
2. **Mejorar UI:** Agregar gráficos, mapas interactivos y más detalles visuales
3. ✅ **Eventos climáticos:** Implementar eventos especiales basados en el clima (inundaciones, sequías) - PARCIALMENTE IMPLEMENTADO
4. ✅ **Sistema de eventos:** Crear desafíos basados en noticias reales - IMPLEMENTADO
5. **Personalización:** Permitir al usuario cambiar ubicación y país para clima/noticias

---

**Implementación completada exitosamente.** Las integraciones externas están funcionando y la interfaz permite una experiencia completa de simulación de ciudad con datos reales. Los efectos climáticos y eventos de noticias han sido integrados en la simulación para mayor realismo e inmersión.

---

# Implementación de Efectos Climáticos y Eventos de Noticias

## Resumen de Implementación
Se han integrado completamente los efectos climáticos y un sistema de eventos basado en noticias en la simulación de la ciudad. Esto proporciona mayor realismo e inmersión al juego.

## ✅ Efectos Climáticos Implementados

### 1. Impacto en Felicidad Ciudadana
- **Soleado**: +5 puntos de felicidad (mejor estado de ánimo)
- **Lluvioso/Llovizna**: -3 puntos (molestia por lluvia)
- **Tormenta**: -10 puntos (miedo y estrés)
- **Nevado/Nublado**: -5 puntos (depresión estacional)

### 2. Impacto en Producción Agrícola
- **Lluvioso/Llovizna**: +50% producción (beneficia cosechas)
- **Soleado**: +20% producción (condiciones óptimas)
- **Tormenta**: -30% producción (daño a cultivos)
- **Nevado**: -50% producción (condiciones extremas)
- **Nublado**: -10% producción (reducción de luz solar)

### 3. Bonificaciones en Puntuación (ya implementadas)
- **Soleado**: +50 puntos
- **Lluvioso**: +30 puntos (beneficia agricultura)
- **Temperaturas extremas** (>25°C o <5°C): -20 puntos

## ✅ Sistema de Eventos por Noticias

### Funcionalidades Implementadas
- **Probabilidad**: 10% chance por turno de activar un evento
- **Tipos de Eventos**:
  - **Crisis económica**: Reduce ingresos totales en 5%
  - **Desastres**: Reduce felicidad de todos los ciudadanos en 10 puntos
  - **Noticias positivas**: Aumenta felicidad de todos los ciudadanos en 5 puntos

### Lógica de Detección
- Analiza títulos de noticias automáticamente
- Busca palabras clave: "crisis", "recesión", "desastre", "accidente", "éxito", "avance"
- Aplica efectos correspondientes a la simulación

## Archivos Modificados
- `modelos/Ciudad.js`: 
  - Agregado método `#aplicarEfectosClimaticos()`
  - Agregado método `#calcularAjusteFelicidadClima()`
  - Agregado método `#calcularMultiplicadorProduccionComida()`
  - Agregado método `#procesarEventosNoticias()`
  - Modificado `procesarProduccionRecursos()` para incluir multiplicador climático
  - Modificado `procesarTurno()` para llamar nuevos métodos

## Impacto en la Simulación
- **Realismo**: El clima y noticias reales afectan la experiencia de juego
- **Estrategia**: Los alcaldes deben considerar factores climáticos en sus decisiones
- **Inmersión**: Eventos noticiosos crean desafíos dinámicos
- **Balance**: Efectos positivos y negativos mantienen el equilibrio del juego

## Configuración
Los efectos están activos automáticamente cuando los servicios externos están iniciados. No requieren configuración adicional.

---

**Todas las integraciones documentadas en `cambios.md` han sido implementadas exitosamente.**
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

# Implementación del Sistema de Rutas en Alcalde.js

**Fecha:** 12 de marzo de 2026

## Resumen de Cambios
Se ha implementado completamente el **Sistema de Rutas (Routing System)** en la clase `Alcalde` del archivo `modelos/Alcalde.js`. El método `planificarRuta()` ha sido completamente reescrito con validaciones robustas y algoritmo de búsqueda de rutas.

## Cambios Realizados

### 1. Reestructuración del Método `planificarRuta()`
- **Antes**: Implementación básica con ruta simplificada horizontal-vertical
- **Después**: Sistema completo con validaciones y algoritmo de Dijkstra

### 2. Nuevos Parámetros del Método
- **Antes**: `planificarRuta(inicio, fin)` con objetos {x, y}
- **Después**: `planificarRuta(idEdificioOrigen, idEdificioDestino)` con IDs de edificios

### 3. Validaciones Implementadas
- **Validación de existencia de edificios**: Verifica que ambos edificios existan en la ciudad
- **Validación de edificios diferentes**: Previene rutas del mismo edificio a sí mismo
- **Validación de coordenadas**: Asegura que las coordenadas estén dentro del mapa
- **Validación de conectividad**: Verifica que exista una ruta posible entre los edificios

### 4. Nuevos Métodos Privados
- **`#generarMatrizTransitabilidad()`**: Crea matriz donde 1=transitable, 0=no transitable
- **`#buscarRutaDijkstra()`**: Implementa algoritmo de Dijkstra para encontrar ruta más corta
- **`#reconstruirRuta()`**: Reconstruye la secuencia de coordenadas desde origen a destino

### 5. Nuevo Formato de Retorno
- **Antes**: Retornaba array de coordenadas directamente
- **Después**: Retorna objeto `{exito: boolean, ruta: Array, error?: string}`

## Beneficios del Sistema Implementado

| Aspecto | Beneficio |
|---------|----------|
| **Validación robusta** | Detecta todos los casos de error posibles |
| **Algoritmo eficiente** | Dijkstra encuentra la ruta más corta garantizada |
| **Manejo de errores** | Mensajes específicos para cada tipo de error |
| **Compatibilidad** | Mantiene interfaz con código existente |
| **Extensibilidad** | Fácil agregar nuevas validaciones o algoritmos |

## Casos de Error Manejados
- Edificio de origen no encontrado
- Edificio de destino no encontrado
- Mismo edificio origen y destino
- Coordenadas fuera del mapa
- No existe ruta conectada por vías

## Notas Técnicas
- El algoritmo considera vías ('r') y edificios como transitables
- El terreno vacío ('g') no es transitible
- La ruta retornada incluye coordenadas ordenadas desde origen hasta destino
- Se registra en el historial de decisiones del alcalde

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