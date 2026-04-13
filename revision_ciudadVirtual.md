# Revisión de Código — Ciudad Virtual P1

---

## 🚨 PENALIZACIÓN CRÍTICA: CSS/JS dentro de HTML (-0.5 por hallazgo)

El documento dice: **"por cada hallazgo de incumplimiento serán -0.5 décimas"**

### `crear_ciudad.html` — **6 atributos `style=` inline + falta `<body>`**

```
Línea 10:  <main style="max-width: 600px; margin: 40px auto;">
Línea 11:  <section class="modal-content" style="background:#0f2e4b; color:#fff;">
Línea 12:  <h2 style="color:#ffda00; text-align:center;">
Línea 86:  <div class="mapa-carga" style="margin-top:8px;">
Línea 88:  <input ... style="display:none" />
Línea 100: <div class="modal-actions" style="justify-content: space-between; gap: 10px; margin-top: 14px;">
```

Además, falta la etiqueta `<body>` de apertura — el HTML va directamente de `</head>` al `<div class="container">`.

**Corrección:** Mover todos esos estilos a `setup.css` o `estilos.css`, y agregar `<body>` después de `</head>`.

Los archivos `game.html`, `index.html` y `ranking.html` no tienen este problema — están bien.

---

## 🔴 BUGS GRAVES (pueden causar que funciones no funcionen en absoluto)

### BUG 1 — `Alcalde.demolerEdificio` pasa `id` donde `Mapa` espera `(x, y)`

**Archivo:** `modelos/Alcalde.js`, línea 110

```js
// INCORRECTO — Mapa.demolerEdificio(x, y) pero se le pasa el id del edificio
const demolido = this.ciudad.mapa.demolerEdificio(idEdificio);
```

`Mapa.demolerEdificio(x, y)` espera coordenadas, no un ID. La demolición vía `Alcalde` nunca funciona.

**Corrección:**
```js
demolerEdificio(idEdificio) {
    const edificio = this.ciudad.edificios.find(e => e.id === idEdificio);
    if (!edificio) return false;

    const resultado = this.ciudad.mapa.demolerEdificio(edificio.x, edificio.y);
    if (resultado.exitoso) {
        this.ciudad.removerEdificio(idEdificio);
        this.ciudad.ingresarDinero(edificio.reembolsoDemolicion);
        this.edificiosDemolidos++;
        // ...registro de decisión
        return true;
    }
    return false;
}
```

> Nota: `CityManager.demoler(x, y)` sí está correctamente implementado y llama directo a `mapa.demolerEdificio(x, y)`. Si el flujo de demolición pasa siempre por `CityManager`, este bug no bloquea la HU-010, pero hay que corregirlo igual.

---

### BUG 2 — `SistemaTurnos.calcularProduccionRecursos` usa tipos incorrectos

**Archivo:** `modelos/SistemaTurnos.js`, líneas 147–156

```js
case 'P1':  // ← ERROR: P1 es PARQUE, no planta de energía
    produccionEnergia += edificio.produccionRecurso;
    break;
case 'U1':  // ← Mezclado: U1 es planta eléctrica, U2 planta de agua
case 'U2':
    produccionAgua += edificio.produccionRecurso;  // ← Error: U1 produce electricidad
    break;
case 'F1':  // ← F1 NO EXISTE en el sistema, la granja es I2
    produccionComida += edificio.produccionRecurso;
    break;
```

Sin embargo, `SistemaTurnos` **no es el que se usa realmente** — el juego usa `Ciudad.procesarTurno()` vía `CityManager.procesarTurno()`. `SistemaTurnos` está declarado pero nunca instanciado en `app.js`. Esto genera **código muerto con bugs** que puede confundir al evaluador.

**Corrección recomendada:** O eliminar `SistemaTurnos.js` completamente (ya que `Ciudad.procesarTurno` lo reemplaza correctamente), o corregir los tipos y dejarlo documentado como alternativa.

---

### BUG 3 — `procesarProduccionRecursos` tiene lógica incorrecta para fábricas (I1)

**Archivo:** `modelos/Ciudad.js`, líneas ~443–453

```js
fabricas.forEach(fabrica => {
    if (fabrica.calcularIngresos) {
        const ingreso = fabrica.calcularIngresos() * multiplicadorIndustrial;
        this.ingresarDinero(ingreso - fabrica.calcularIngresos()); // ← Neto = 0 o negativo
    }
});
```

La expresión `ingreso - fabrica.calcularIngresos()` es:
- Si `multiplicadorIndustrial = 1.0`: `800 - 800 = 0` → aporta $0
- Si `multiplicadorIndustrial = 0.5`: `400 - 800 = -400` → resta dinero

Los ingresos de fábricas los procesa correctamente `procesarIngresos()` más abajo. Este bloque en `procesarProduccionRecursos` es redundante y erróneo.

**Corrección:** Eliminar el bloque de fábricas de `procesarProduccionRecursos`:

```js
// ELIMINAR este bloque — los ingresos de I1 ya los maneja procesarIngresos()
// const fabricas = this.edificios.filter(e => e.tipo === 'I1' && e.estaOperativo);
// fabricas.forEach(fabrica => { ... });
```

---

## 🟡 INCUMPLIMIENTOS DE HISTORIAS DE USUARIO

### HU-001 — Creación de ciudad

- ✅ Formulario con todos los campos obligatorios
- ✅ Validación de campos
- ✅ Recursos iniciales correctos ($50,000, etc.)
- ✅ Redirección a vista de juego
- ✅ Guardado en LocalStorage
- ⚠️ **La región de Colombia usa `api-colombia.com`** ✅ (implementado correctamente en `crear_ciudad.js` y `viewController.js`)
- ❌ **`crear_ciudad.html` tiene 6 `style=` inline** → penalización

---

### HU-002 — Cargar mapa desde archivo .txt

- ✅ Botón "Cargar Mapa" presente
- ✅ Selector acepta `.txt`
- ✅ Parseo de tokens (g, r, R1, C1, I1, S1, U1, P1, etc.)
- ✅ Crea instancias de edificio desde tipos
- ✅ Valida dimensiones 15×15 a 30×30
- ✅ Mensaje de error ante formato incorrecto
- ✅ Guarda estado en LocalStorage
- ⚠️ El costo total se descuenta del dinero inicial — es razonable pero no está especificado

---

### HU-003 a HU-009 — Construcción de edificios y vías

- ✅ Todos los tipos (R1, R2, C1, C2, I1, I2, S1, S2, S3, U1, U2, P1, r) implementados con valores correctos del documento
- ✅ Validación: celda vacía, dinero suficiente, vía adyacente obligatoria para edificios
- ✅ Las vías no requieren vía adyacente
- ✅ Notificaciones de éxito/error
- ✅ Costos correctos según tabla del documento
- ✅ Capacidades y consumos correctos en `EdificioFactory.js`
- ⚠️ **HU-004 criterio:** "Si no hay electricidad, el edificio no genera dinero" — esto no está implementado; la electricidad se verifica como `hayElectricidad` para el multiplicador industrial, pero los comerciales siempre generan ingresos independientemente de si hay electricidad.

**Corrección para HU-004:**
```js
// En procesarIngresos() — Ciudad.js
comercios.forEach(comercio => {
    if (comercio.estaOperativo && comercio.calcularIngresos) {
        // Solo genera ingresos si hay electricidad disponible
        if (this.recursos.electricidad > 0) {
            ingresosTotales += comercio.calcularIngresos();
        }
    }
});
```

---

### HU-010 — Demoler edificios y vías

- ✅ Modo demolición implementado
- ✅ Mensaje de confirmación con nombre del edificio
- ✅ Informa ciudadanos afectados
- ✅ Reembolso del 50%
- ✅ Actualiza recursos
- ✅ Notificación con dinero recuperado
- ⚠️ Bug menor: `Alcalde.demolerEdificio` tiene el bug del ID (BUG 1), pero `CityManager.demoler` es el path real y funciona correctamente

---

### HU-011 — Ver información de edificio

- ✅ Click en edificio muestra información
- ✅ Muestra tipo, costo, recursos que consume/produce
- ✅ Capacidad y ocupación actual
- ✅ Para residenciales: ciudadanos viviendo
- ✅ Para comerciales/industriales: empleados
- ✅ Botón "Demoler" en el panel
- ✅ Panel se cierra con botón cerrar

---

### HU-012 — Calcular ruta óptima (Dijkstra)

- ✅ Botón "Calcular Ruta" presente
- ✅ Selección de origen y destino
- ✅ Construye matriz binaria (r=1, resto=0)
- ✅ Llama a backend `POST /api/calculate-route` en `http://127.0.0.1:5000`
- ✅ Tiene fallback local (BFS) si el backend no está disponible
- ✅ Anima la ruta en el mapa
- ✅ Mensaje "No hay ruta disponible" si no existe conexión
- ⚠️ El spec dice `origin`/`destination`, el código envía `start`/`end` al backend — verificar que el backend del profesor acepte esa nomenclatura

---

### HU-013 — Sistema de gestión de ciudadanos

- ✅ Ciudadanos se crean automáticamente cada turno si: felicidad > 60, hay vivienda disponible, hay empleos
- ✅ Tasa 1–3 ciudadanos/turno (configurable)
- ✅ Asignación automática de vivienda y empleo
- ✅ Felicidad: +20 vivienda, +15 empleo, +10 servicios, +5 parques
- ✅ Estadísticas de población mostradas
- ⚠️ La felicidad base arranca en 50, no en 0; esto puede hacer que la condición `> 60` tarde en cumplirse correctamente

---

### HU-014 — Gestión automática de recursos por turno

- ✅ Ciclo automático de turnos (configurable, default 10s)
- ✅ Secuencia correcta: producción → consumo → mantenimiento → felicidad → puntuación → guardado
- ✅ Notificación si recurso llega a 0
- ✅ Game over si electricidad o agua son negativos
- ❌ **Bug BUG 3:** Los ingresos de fábricas I1 se calculan dos veces (en `procesarProduccionRecursos` y en `procesarIngresos`), pero el primero da un valor incorrecto (ver BUG 3)
- ⚠️ El mantenimiento en `procesarCostos()` usa `0.0001 * costo` (muy bajo, casi 0 para casas). En `SistemaTurnos` se usa `0.1` (10%). El documento no especifica el porcentaje exacto, pero hay inconsistencia entre las dos implementaciones.

---

### HU-015 — Panel de recursos

- ✅ Panel de recursos visible en tiempo real
- ✅ Dinero, electricidad, agua, alimentos mostrados
- ✅ Tooltips explicativos en cada recurso
- ✅ Ajuste manual de recursos (cajas de texto para electricidad, agua, alimentos)
- ✅ Producción y consumo calculados
- ⚠️ El panel no muestra explícitamente "producción/turno vs consumo/turno" como balance separado (solo el total acumulado)

---

### HU-016 — Integración con API del Clima

- ✅ Llama a OpenWeatherMap con lat/lon de la ciudad
- ✅ Muestra temperatura, condición, humedad, velocidad del viento
- ✅ Actualización automática cada 30 minutos
- ✅ Icono de clima renderizado en UI
- ✅ Fallback si la API falla
- ✅ API key presente en `config.js` (``)

---

### HU-017 — Integración con API de Noticias

- ✅ Llama a NewsAPI con código de país
- ✅ Muestra últimas 5 noticias
- ✅ Título, descripción, enlace, timestamp mostrados
- ✅ Actualización automática cada 30 minutos
- ✅ Fallback a Google RSS si NewsAPI falla
- ✅ Fallback local si Google RSS falla
- ❌ **`NEWS_API_KEY` en `config.js` dice `'AQUI_TU_KEY_DE_NEWSAPI'`** — la API de noticias reales no funcionará. La imagen de la noticia puede no mostrarse (no siempre disponible en RSS).

---

### HU-018 — Cálculo y visualización de puntuación

- ✅ Fórmula correcta implementada en `Ciudad.#actualizarPuntuacion()`
- ✅ Todas las bonificaciones: empleados 100% (+500), felicidad>80 (+300), recursos todos positivos (+200), población>1000 (+1000)
- ✅ Todas las penalizaciones: dinero negativo (-500), electricidad negativa (-300), agua negativa (-300), felicidad<40 (-400), desempleados (-10/c)
- ✅ Puntuación mostrada en header
- ❌ **Falta el desglose de puntuación** — la HU pide mostrar por separado: puntos por población, por felicidad, por edificios, por recursos, bonificaciones, penalizaciones, total. Solo se muestra el total.

---

### HU-019 — Sistema de ranking local

- ✅ Guardado automático en LocalStorage (`ciudadVirtual_ranking`)
- ✅ Ordenado por puntuación descendente
- ✅ Top 10 ciudades
- ✅ Posición, nombre ciudad, alcalde, puntuación, turno, fecha
- ✅ Ciudad actual resaltada
- ✅ Si no está en top 10 se muestra "Tu ciudad: #XX"
- ✅ Reiniciar ranking con confirmación
- ❌ **Faltan columnas en la tabla de ranking:** el spec pide mostrar `población` y `felicidad promedio`, pero la tabla solo tiene: posición, ciudad, alcalde, puntuación, turno, fecha.
- ❌ **Falta opción "Exportar ranking a JSON"** (mencionada en HU-019)

**Corrección en `RankingLocal.guardarPuntuacion`:**
```js
const entradaCiudad = {
    nombre: ciudad.nombre,
    cityId: ciudad.cityId,
    alcaldeNombre: ciudad.alcalde.nombre,
    puntuacionAcumulada: ciudad.puntuacionAcumulada,
    poblacion: ciudad.poblacion.length,                           // AGREGAR
    felicidadPromedio: Math.round(ciudad.obtenerFelicidadPromedio()), // AGREGAR
    turnoActual: ciudad.turnoActual,
    fechaGuardado: new Date().toISOString()
};
```

---

### HU-020 — Guardar y cargar partida

- ✅ Guardado automático cada 30 segundos (`CityManager.iniciarAutoGuardado`)
- ✅ Guarda estado completo de la ciudad (mapa, edificios, vías, recursos, ciudadanos, turno, puntuación, histórico)
- ✅ Al cargar detecta partida guardada
- ✅ Muestra modal "¿Continuar partida anterior?"
- ✅ Opciones "Continuar" y "Nueva Ciudad"
- ✅ Reconstruye instancias de objetos desde JSON
- ✅ Indicador "Guardando..." implementado
- ✅ Botón "Guardar Partida" manual presente
- ✅ Eliminar partida guardada con confirmación

---

### HU-021 — Exportar a JSON

- ✅ Opción "Exportar Ciudad" presente
- ✅ Genera JSON con todos los campos requeridos (cityName, mayor, gridSize, coordinates, turn, score, map, buildings, roads, resources, citizens, population, happiness)
- ✅ Descarga con nombre `ciudad_{nombre}_{fecha}.json`
- ✅ Notificación de éxito
- ✅ Pretty-print con indentación
- ⚠️ El JSON exportado sigue el formato del spec, pero `map` es la grid (array 2D), no el objeto completo `mapa` — debería ser compatible con HU-002 para reimportar

---

### HU-022/023/024 — Diseño Responsive

- ✅ Layout de 3 columnas en desktop (sidebar izq, mapa, sidebar der)
- ✅ CSS con media queries en `estilos.css`
- ✅ Sidebar izquierdo con recursos y menú de construcción
- ✅ Sidebar derecho con clima, noticias, estadísticas
- ✅ Botones con tamaño adecuado para touch
- ✅ Atajos de teclado: Space (pausa), S (guardar), ESC (cancelar modo)
- ⚠️ Verificar que en móvil (< 768px) el menú de construcción se muestre como tabs inferiores — revisar en dispositivo real

---

## 📋 RESUMEN DE CORRECCIONES PRIORITARIAS

| Prioridad | Archivo | Problema | Impacto |
|-----------|---------|----------|---------|
| 🔴 Crítico | `crear_ciudad.html` | 6 atributos `style=` inline + falta `<body>` | **Penalización: -3.0 décimas** |
| 🔴 Crítico | `modelos/Ciudad.js` | BUG 3: ingresos de fábricas I1 calculados incorrectamente en `procesarProduccionRecursos` | HU-014 parcialmente rota |
| 🔴 Crítico | `acceso_datos/config.js` | `NEWS_API_KEY` sin configurar | HU-017 sin API real |
| 🟠 Alto | `modelos/Alcalde.js` | BUG 1: `demolerEdificio` pasa `id` en vez de `(x,y)` al mapa | HU-010 por path del Alcalde |
| 🟠 Alto | `modelos/Ciudad.js` | Comerciales no verifican electricidad antes de generar ingresos | HU-004 incompleta |
| 🟠 Alto | `acceso_datos/RankingLocal.js` | No guarda `poblacion` ni `felicidadPromedio` | HU-019 incompleta |
| 🟡 Medio | `presentacion/vistas/ranking.js` | Tabla no muestra población ni felicidad, falta exportar JSON | HU-019 incompleta |
| 🟡 Medio | `negocio/viewController.js` | Desglose de puntuación no mostrado | HU-018 incompleta |
| 🟡 Medio | `modelos/SistemaTurnos.js` | Tipos incorrectos (P1, F1, mezcla U1/U2) — código muerto con bugs | Confuso para evaluador |

---

## ✅ LO QUE ESTÁ BIEN IMPLEMENTADO

- Arquitectura MVC bien separada (modelos / negocio / presentacion / acceso_datos)
- Todos los archivos HTML solo referencian CSS/JS externos (excepto `crear_ciudad.html`)
- `EdificioFactory.js` con todos los tipos y valores correctos según el documento
- Sistema de turnos usando `Ciudad.procesarTurno()` — lógica correcta y completa
- Algoritmo Dijkstra implementado tanto en backend como fallback local
- `Ciudad.fromJSON` / `toJSON` robustos con compatibilidad legacy
- Servicios externos (clima, noticias) con fallbacks escalonados
- `api-colombia.com` correctamente integrado en `viewController.js` y `crear_ciudad.js`
- Game Over por electricidad/agua negativa correctamente implementado
- Guardado automático y autoguardado cada 30s
- Exportación a JSON con nombre correcto
