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