# 📊 Diagrama de Flujo - Funcionamiento de Botones

## Flujo General de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                      USUARIO EN NAVEGADOR                        │
│                      (game.html + UI)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │ Hace click
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   VISTA (ViewController)                          │
│  - Detecta click en botón (event listener)                       │
│  - Extrae datos si es necesario (ej: ID edificios)               │
│  - Llama callback onConstruir/onProcesarTurno/etc               │
└────────────────────────┬────────────────────────────────────────┘
                         │ Callback
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   LÓGICA (App.js)                                │
│  - procesarTurno()                                               │
│  - iniciarServiciosExternos()                                    │
│  - exportarCiudad()                                              │
│  - iniciarCicloTurnos() / detenerCicloTurnos()                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ Llama métodos en manager
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GESTOR (CityManager.js)                          │
│  - Singleton central de control                                 │
│  - Maneja ciclos de turnos                                       │
│  - Controla persistencia                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ Llama métodos en ciudad
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  MODELO (Ciudad.js)                              │
│  - procesarTurno()                                               │
│  - iniciarServiciosExternos()                                    │
│  - cargarMapaDesdeTexto()                                        │
│  - obtenerEstadoGeneral()                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │ Llama métodos específicos
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           SERVICIOS Y PERSISTENCIA                               │
│  - ServicioClima.js (fetch OpenWeatherMap)                       │
│  - ServicioNoticias.js (fetch NewsAPI)                           │
│  - CityRepository.js (LocalStorage)                              │
│  - GameRepository.js (Backend REST - opcional)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ Retorna datos
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              ESTADO ACTUALIZADO                                  │
│  - Dinero: 45000 → 50000                                         │
│  - Turno: 5 → 6                                                  │
│  - Población: 120 → 125                                          │
│  - Clima: Actualizado                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │ Retorna a App.js
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              UI se RENDERIZA                                     │
│  - actualizarUI() en App.js                                      │
│  - ViewController renderiza cambios                              │
│  - DOM se actualiza                                              │
│  - Usuario ve cambios en pantalla                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo Específico por Botón

### 1️⃣ PROCESAR TURNO

```
Usuario click "Procesar Turno"
        ↓
ViewController detecta click
        ↓
Ejecuta onProcesarTurno() → app.procesarTurno()
        ↓
Valida que ciudad existe
        ↓
CityManager.procesarTurno()
        ↓
Ciudad.procesarTurno() ejecuta:
  ├─ Incrementa turnoActual+1
  ├─ Procesa producción recursos (U1, U2 edificios)
  ├─ Procesa consumo recursos (ciudadanos, edificios)
  ├─ Aplica ingresos (comercios, industrias)
  ├─ Aplica costos mantenimiento
  ├─ Actualiza felicidad ciudadanos
  ├─ Aplica efectos climáticos
  ├─ Procesa eventos noticias
  ├─ Gestiona crecimiento poblacional
  ├─ Asigna automáticamente viviendas/empleos
  └─ Actualiza puntuación
        ↓
CityManager.save() → LocalStorage
        ↓
App.actualizarUI() renderiza todo
        ↓
Usuario ve:
  • Turno incrementado
  • Recursos actualizados
  • Mapa renderizado
  • Estadísticas actualizadas
```

---

### 2️⃣ INICIAR SERVICIOS EXTERNOS

```
Usuario click "Iniciar Servicios Externos"
        ↓
ViewController detecta click
        ↓
Ejecuta onIniciarServicios() → app.iniciarServiciosExternos()
        ↓
Valida que servicios NO están iniciados
        ↓
Valida que ciudad existe
        ↓
Ciudad.iniciarServiciosExternos():
  ├─ Verifica API keys configuradas
  ├─ ServicioClima.iniciarActualizacionAutomatica()
  │  └─ Fetch a OpenWeatherMap cada 30 min
  └─ ServicioNoticias.iniciarActualizacionAutomatica()
     └─ Fetch a NewsAPI cada 30 min
        ↓
App.js recibe feedback
        ↓
Botón se deshabilita + muestra "✓"
        ↓
Usuario ve:
  • Botón deshabilitado
  • Alerta confirmación
  • Clima se actualiza en sidebar derecho
  • Noticias se actualizan en sidebar derecho
```

---

### 3️⃣ INICIAR TURNOS AUTOMÁTICOS

```
Usuario click "Iniciar Turnos Automáticos"
        ↓
ViewController detecta click
        ↓
Ejecuta onIniciarTurnos()
        ↓
CityManager.iniciarCicloTurnos(callback)
        ↓
Inicia setInterval cada 10 segundos:
  ├─ Ejecuta: CityManager.procesarTurno()
  │  └─ Igual que Test 1 (PROCESAR TURNO)
  │
  ├─ Ejecuta: callback → app.actualizarUI()
  │  └─ Renderiza todo cambio en UI
  │
  └─ Repite cada 10 segundos...
        ↓
Botones cambian estado:
  • "Iniciar Turnos" → DESHABILITADO
  • "Detener Turnos" → HABILITADO
        ↓
Usuario ve:
  • Turno incrementa cada 10 segundos
  • Recursos cambian automáticamente
  • Mapa se redibuja
  • Población crece
```

---

### 4️⃣ DETENER TURNOS AUTOMÁTICOS

```
Usuario click "Detener Turnos"
        ↓
ViewController detecta click
        ↓
Ejecuta onDetenerTurnos()
        ↓
CityManager.detenerCicloTurnos()
        ↓
clearInterval() → Se cancela setInterval
        ↓
turnIntervalId = null
        ↓
Botones cambian estado:
  • "Detener Turnos" → DESHABILITADO
  • "Iniciar Turnos" → HABILITADO
        ↓
Usuario ve:
  • Turnos se detienen
  • Puede hacer click en "Iniciar Turnos" de nuevo
  • Puede procesar turno manualmente
```

---

### 5️⃣ EXPORTAR JSON

```
Usuario click "Exportar JSON"
        ↓
ViewController detecta click
        ↓
Ejecuta onExportar() → app.exportarCiudad()
        ↓
Valida que ciudad existe
        ↓
CityManager.exportToFile()
        ↓
Ciudad.toJSON() serializa:
  ├─ Nombre, Alcalde, Región
  ├─ Tamaño del mapa
  ├─ Turno actual
  ├─ Puntuación
  ├─ Recursos (dinero, electricidad, agua, comida)
  ├─ Mapa (grid completo)
  ├─ Edificios (lista completa)
  ├─ Vías (lista completa)
  ├─ Ciudadanos (población con estado)
  └─ Felicidad promedio
        ↓
CityRepository.exportToFile(json, filename)
        ↓
Crea Blob JSON
        ↓
Simula descargar archivo (a.download)
        ↓
Archivo se descarga con nombre:
  ciudad_[nombreCiudad]_[timestamp].json
        ↓
Usuario ve:
  • Alerta con nombre del archivo
  • Archivo en carpeta Descargas
  • JSON contiene todo el estado del juego
```

---

## Estado de Persistencia

```
┌──────────────────────────────────────────┐
│        Después de PROCESAR TURNO         │
├──────────────────────────────────────────┤
│ LocalStorage:                            │
│  ciudadVirtual_partida_activa: {         │
│    turnoActual: 6                        │
│    dinero: 50000                         │
│    electricidad: 150                     │
│    agua: 200                             │
│    ... (resto del estado)                │
│  }                                       │
└──────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────┐
│     Después de EXPORTAR JSON             │
├──────────────────────────────────────────┤
│ Archivo Descargado:                      │
│  ciudad_mi-ciudad_20260406_143022.json   │
│                                          │
│ Contenido:                               │
│ {                                        │
│   "cityName": "Mi Ciudad",               │
│   "mayor": "Alcalde Principal",          │
│   "gridSize": {                          │
│     "width": 20,                         │
│     "height": 20                         │
│   },                                    │
│   "turn": 6,                             │
│   "score": 12500,                        │
│   "resources": {                         │
│     "dinero": 50000,                     │
│     "electricidad": 150,                 │
│     "agua": 200,                         │
│     "comida": 75                         │
│   },                                    │
│   "map": [...],                          │
│   "buildings": [...]                     │
│   ... (más datos)                        │
│ }                                        │
└──────────────────────────────────────────┘
```

---

## Cambios de UI por Estado

### Estado Inicial
```
┌─────────────────────────────────────┐
│ BOTONES INICIALES                   │
├─────────────────────────────────────┤
│ ✅ Procesar Turno           [activo]│
│ ✅ Iniciar Servicios Ext... [activo]│
│ ✅ Iniciar Turnos Automá... [activo]│
│ ⚪ Detener Turnos          [inactivo]│
│ ✅ Exportar JSON            [activo]│
└─────────────────────────────────────┘
```

### Después de "Iniciar Turnos"
```
┌─────────────────────────────────────┐
│ BOTONES DURANTE TURNOS              │
├─────────────────────────────────────┤
│ ✅ Procesar Turno           [activo]│
│ ✅ Iniciar Servicios Ext... [activo]│
│ ⚪ Iniciar Turnos Automá... [inactivo]│
│ ✅ Detener Turnos           [activo]│
│ ✅ Exportar JSON            [activo]│
└─────────────────────────────────────┘
```

### Después de "Iniciar Servicios"
```
┌─────────────────────────────────────┐
│ BOTONES DESPUÉS SERVICIOS           │
├─────────────────────────────────────┤
│ ✅ Procesar Turno           [activo]│
│ ⚪ Iniciar Servicios Ext... [inactivo]│
│         (muestra "✓")                │
│ ✅ Iniciar Turnos Automá... [activo]│
│ ⚪ Detener Turnos          [inactivo]│
│ ✅ Exportar JSON            [activo]│
└─────────────────────────────────────┘
```

---

## Ciclo Completo (Vida del Juego)

```
1. INICÍO
   Usuario abre game.html
   ↓ Carga última ciudad guardada o muestra modal
   
2. SETUP
   Click "Iniciar Servicios Externos" (opcional)
   ↓ Clima y Noticias comienzan a actualizarse
   
3. JUEGO MANUAL
   Click "Procesar Turno" varias veces
   ↓ Controla cada turno manualmente
   
4. JUEGO AUTOMÁTICO
   Click "Iniciar Turnos Automáticos"
   ↓ Turnos avanzan cada 10 segundos
   ↓ Puede pausar con "Detener Turnos"
   
5. JUEGO CONTINUO
   Mezcla turnos manuales + automáticos
   ↓ Construye mientras automático corre
   ↓ Pausar/Resume como prefiera
   
6. FINALIZACIÓN
   Click "Exportar JSON"
   ↓ Descarga snapshot del estado
   ↓ Continúa jugando o cierra sesión
```

---

## Arquitectura Simplificada

```
┌─ PRESENTACION ─────────────────────┐
│  game.html                          │
│  ├─ Sidebar Left (Controles)        │
│  ├─ Centro (Mapa)                   │
│  └─ Sidebar Right (Clima/Noticias)  │
└────────────┬───────────────────────┘
             │ Interacción DOM
┌────────────▼───────────────────────┐
│ viewController.js                   │
│ (Maneja eventos del DOM)            │
└────────────┬───────────────────────┘
             │ Callbacks
┌────────────▼───────────────────────┐
│ app.js (App)                        │
│ (Lógica de aplicación)              │
└────────────┬───────────────────────┘
             │ Manager API
┌────────────▼───────────────────────┐
│ CityManager.js (Singleton)          │
│ (Controla ciclo de turnos)          │
└────────────┬───────────────────────┘
             │ Ciudad API
┌────────────▼───────────────────────┐
│ Ciudad.js + Modelos                 │
│ (Lógica de negocio)                 │
└────────────┬───────────────────────┘
             │ Persistencia
┌────────────▼───────────────────────┐
│ CityRepository.js (LocalStorage)    │
│ GameRepository.js (Backend REST)    │
└────────────────────────────────────┘
```

---

## Validaciones Implementadas

```
┌─ PROCESAR TURNO ────────────────────┐
│ ✓ ¿Existe ciudad?                   │
│ ✓ Try-catch para errores            │
│ ✓ Valida estado ante negativo       │
└─────────────────────────────────────┘

┌─ INICIAR SERVICIOS ─────────────────┐
│ ✓ ¿Servicios ya iniciados?          │
│ ✓ ¿Existe ciudad?                   │
│ ✓ ¿API keys configuradas?           │
│ ✓ Try-catch para errores            │
└─────────────────────────────────────┘

┌─ CICLOS DE TURNOS ──────────────────┐
│ ✓ ¿Ciclo ya activo?                 │
│ ✓ Validar callback en cada turno    │
│ ✓ Try-catch en callback             │
└─────────────────────────────────────┘

┌─ EXPORTAR JSON ─────────────────────┐
│ ✓ ¿Existe ciudad?                   │
│ ✓ ¿Se generó filename?              │
│ ✓ Try-catch para errores            │
└─────────────────────────────────────┘
```

---

**Este diagrama muestra cómo todos los botones se integran en una arquitectura cohesiva sin romper el trabajo existente.**
