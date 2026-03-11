# Creación de la Clase SistemaTurnos

**Fecha:** 10 de marzo de 2026

## Resumen de Cambios

Se ha implementado el **Sistema de Turnos** como una clase independiente (`SistemaTurnos.js`) que gestiona la evolución temporal de la simulación urbana. Esta implementación responde a la necesidad de un sistema centralizado que coordine las 6 acciones secuenciales por turno según la documentación del juego.

## Arquitectura del Sistema de Turnos

### ¿Por qué una clase independiente?

El sistema de turnos **NO** debería estar dentro de la clase `Ciudad` por las siguientes razones:

1. **Separación de responsabilidades**: Ciudad maneja estado, SistemaTurnos maneja tiempo
2. **Reutilización**: Puede aplicarse a múltiples ciudades
3. **Mantenibilidad**: Cambios en lógica temporal sin afectar Ciudad
4. **Testabilidad**: Pruebas unitarias independientes del estado de Ciudad

### Estructura de la Clase SistemaTurnos

#### Atributos Principales:
- `ciudad`: Referencia a la instancia de Ciudad que gestiona
- `duracionTurno`: Tiempo en ms entre turnos (configurable)
- `enEjecucion`: Estado del sistema (activo/pausado)
- `intervalID`: ID del intervalo de JavaScript
- `turnosEjecutados`: Contador de turnos procesados
- `ultimoTurno`: Timestamp del último turno ejecutado

#### Métodos de Control:
- `iniciar()`: Inicia turnos automáticos
- `pausar()`: Pausa el sistema
- `reanudar()`: Reanuda turnos automáticos
- `detener()`: Detiene completamente
- `ejecutarTurnoManual()`: Ejecuta un turno bajo demanda

## Las 6 Acciones por Turno

Cada turno ejecuta **secuencialmente** las siguientes acciones:

### 1. Calcular Producción de Recursos
```javascript
calcularProduccionRecursos()
```
- Recorre todos los edificios operativos
- Suma producción de plantas de energía (P1), agua (U1,U2) y granjas (F1)
- Actualiza `ciudad.recursos.produccionEnergia/Agua/Comida`

### 2. Calcular Consumo de Recursos
```javascript
calcularConsumoRecursos()
```
- Suma consumo de todos los ciudadanos
- Suma consumo de edificios (excepto parques)
- Aplica consumo de comida directamente a `recursos.alimentos`

### 3. Aplicar Costos de Mantenimiento
```javascript
aplicarCostosMantenimiento()
```
- Cada edificio cuesta 10% de su costo de construcción por turno
- Si no hay fondos suficientes, el edificio deja de operar
- Actualiza `ciudad.recursos.dinero`

### 4. Actualizar Felicidad de Ciudadanos
```javascript
actualizarFelicidadCiudadanos()
```
- Llama a `ciudadano.actualizarFelicidad()` para cada ciudadano
- Calcula felicidad promedio de la ciudad
- Reporta ciudadanos con felicidad crítica (< 20)

### 5. Actualizar Puntuación
```javascript
actualizarPuntuacion()
```
- **Felicidad** (0-50 puntos): Felicidad promedio / 2
- **Recursos** (0-30 puntos): Bonus por dinero, alimentos, balances netos
- **Desarrollo** (0-20 puntos): 2 puntos por edificio operativo
- Actualiza `ciudad.puntuacionAcumulada`
- Otorga experiencia al alcalde

### 6. Guardar en LocalStorage
```javascript
guardarEnLocalStorage()
```
- Persiste estado completo de la ciudad
- Incluye estadísticas del alcalde, recursos, poblacion, etc.
- Timestamp del guardado automático

## Integración con Ciudad

### Cambios en Ciudad.js:
- **Nueva importación**: `import { SistemaTurnos } from './SistemaTurnos.js'`
- **Nueva instancia**: `this.sistemaTurnos = new SistemaTurnos(this)`

### Uso desde la interfaz:
```javascript
// Iniciar turnos automáticos
ciudad.sistemaTurnos.iniciar();

// Ejecutar un turno manual
ciudad.sistemaTurnos.ejecutarTurnoManual();

// Pausar turnos
ciudad.sistemaTurnos.pausar();

// Cambiar duración del turno (ej: 30 segundos)
ciudad.sistemaTurnos.configurarDuracionTurno(30);
```

## Características Avanzadas

### Persistencia Automática
- Cada turno guarda automáticamente el estado
- Método `cargarDesdeLocalStorage()` para restaurar partida

### Estadísticas del Sistema
```javascript
const stats = ciudad.sistemaTurnos.obtenerEstadisticas();
// Retorna: turnos ejecutados, último turno, estado, duración, etc.
```

### Configuración Flexible
- Duración configurable entre 1-300 segundos
- Sistema puede pausarse/reanudarse en cualquier momento
- Ejecución manual posible incluso con sistema automático pausado

## Beneficios de la Implementación

| Aspecto | Beneficio |
|--------|----------|
| **Modularidad** | Lógica temporal separada del estado de Ciudad |
| **Escalabilidad** | Fácil agregar nuevas acciones por turno |
| **Robustez** | Manejo de errores que pausa el sistema si falla |
| **Persistencia** | Guardado automático previene pérdida de progreso |
| **Flexibilidad** | Control manual y automático de turnos |

## Próximos Pasos Recomendados

1. **Integrar con interfaz gráfica**: Botones para iniciar/pausar turnos
2. **Validaciones adicionales**: Verificar que métodos de Ciudad existan
3. **Eventos del sistema**: Notificaciones cuando turnos se ejecutan
4. **Configuración de UI**: Permitir cambiar duración del turno
5. **Pruebas unitarias**: Verificar cada acción del turno independientemente

## Consideraciones Técnicas

- **Dependencias**: Requiere que Ciudad tenga métodos `actualizarFelicidad()` en ciudadanos
- **Rendimiento**: Las 6 acciones se ejecutan secuencialmente por turno
- **Memoria**: Referencia circular Ciudad ↔ SistemaTurnos (normal en este contexto)
- **Error handling**: Sistema se pausa automáticamente si ocurre un error durante el turno