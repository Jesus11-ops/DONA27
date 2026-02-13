# 🔄 ACTUALIZACIÓN v3.2 - Egresos Discriminados por Fuente

## ✅ ¿Qué se actualizó?

He actualizado el sistema para que los egresos se registren especificando **de qué fuente salen** (Ofrendas Solidarias o Aportes Individuales).

### Archivos Modificados:
1. ✅ **donaciones-app.js** - Lógica de egresos discriminados y saldos por fuente
2. ✅ **donaciones-FOSU2.html** - Nueva sección de saldos disponibles y selector de fuente
3. ⚪ **donaciones-style.css** - Sin cambios
4. ⚪ **donaciones-exportar.js** - Sin cambios
5. ⚪ **donaciones-auth.js** - Sin cambios
6. ⚪ **index.html** - Sin cambios

---

## 🆕 Nuevas Funcionalidades

### 1. Selector de Fuente al Registrar Egreso
Ahora al registrar un egreso debes **seleccionar de dónde sale el dinero**:
- ⛪ **Ofrendas Solidarias**
- 👤 **Aportes Individuales**

### 2. Dos Secciones de Resumen

**ARRIBA - Registro Histórico (📜 NO cambia NUNCA):**
```
┌─────────────────────────────────────────────────┐
│  💰 RESUMEN FINANCIERO                          │
│  📜 Registro histórico acumulado (no cambia)    │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Desglose de Ingresos (Histórico)           │
│  ⛪ Ofrendas: $5.403.400 | 👤 Aportes: $342.000│
│                                                 │
└─────────────────────────────────────────────────┘
```
Estos valores son el **total acumulado histórico** y **NUNCA cambian**.

**ABAJO - Saldo Disponible Actual (💼 SÍ cambia con cada egreso):**
```
┌─────────────────────────────────────────────────┐
│  💼 SALDO DISPONIBLE ACTUAL POR FUENTE         │
│  ✅ Se actualiza con cada egreso               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⛪ Ofrendas Solidarias    👤 Aportes Indiv.   │
│  $0                        $0                  │
│  Disponible ahora          Disponible ahora    │
│                                                 │
└─────────────────────────────────────────────────┘
```
Estos valores **se actualizan** cada vez que registras un egreso.

### 3. Validación de Saldo
El sistema **NO permite** registrar un egreso si el saldo disponible en esa fuente es insuficiente.

---

## 📊 EJEMPLO CON TUS DATOS REALES

### Situación que mencionaste:

**Totales Históricos (arriba):**
- Ofrendas Solidarias: $5.403.400
- Aportes Individuales: $342.000
- **TOTAL:** $5.745.400

**Total de Egresos registrados:** $5.745.400

Si ese total de $5.745.400 salió de **AMBAS fuentes**:

**Opción 1: Si sacaste TODO de Ofrendas Solidarias**
- Saldo Ofrendas: $0 ($5.403.400 - $5.745.400 = -$342.000) ❌ **NEGATIVO**
- Saldo Aportes: $342.000 (sin cambios)

**Opción 2: Si sacaste proporcional de ambas fuentes**
Ejemplo: Sacaste $5.403.400 de Ofrendas + $342.000 de Aportes
- Saldo Ofrendas: $0
- Saldo Aportes: $0

**Opción 3: Si sacaste en otro orden**
Tú defines de dónde sale cada egreso individual.

---

## 🎯 CÓMO FUNCIONA

### Paso a Paso:

**1. Tienes ingresos históricos:**
- Ofrendas: $5.403.400
- Aportes: $342.000

**2. Registras primer egreso de $3.000.000:**
- Seleccionas: "⛪ Ofrendas Solidarias"
- Ingresas monto: $3.000.000
- Sistema resta: $5.403.400 - $3.000.000 = $2.403.400

**Resultado:**
- Saldo Ofrendas: $2.403.400 ✅
- Saldo Aportes: $342.000 ✅ (sin cambios)

**3. Registras segundo egreso de $2.403.400:**
- Seleccionas: "⛪ Ofrendas Solidarias"
- Ingresas monto: $2.403.400
- Sistema resta: $2.403.400 - $2.403.400 = $0

**Resultado:**
- Saldo Ofrendas: $0 ✅
- Saldo Aportes: $342.000 ✅ (sin cambios)

**4. Registras tercer egreso de $342.000:**
- Seleccionas: "👤 Aportes Individuales"
- Ingresas monto: $342.000
- Sistema resta: $342.000 - $342.000 = $0

**Resultado FINAL:**
- Saldo Ofrendas: $0 ✅
- Saldo Aportes: $0 ✅

**Total egresado:** $3.000.000 + $2.403.400 + $342.000 = **$5.745.400** ✅

---

## 🚀 CÓMO IMPLEMENTAR

### Paso 1: Hacer Respaldo
**IMPORTANTE:** Antes de subir los archivos nuevos:
1. Exporta Excel con tus datos actuales
2. O descarga tus archivos como respaldo

### Paso 2: Subir Archivos Nuevos
**Sube SOLO estos 2 archivos** (los demás no cambiaron):

```
✅ donaciones-app.js          (ACTUALIZADO v3.2)
✅ donaciones-FOSU2.html       (ACTUALIZADO v3.2)
```

### Paso 3: Limpiar Caché
1. Cierra todas las pestañas del sistema
2. Abre pestaña nueva
3. Presiona **Ctrl + Shift + R** (Windows/Linux) o **Cmd + Shift + R** (Mac)

### Paso 4: Verificar
1. Inicia sesión
2. Deberías ver:
   - ✅ Nueva sección "Saldo Disponible Actual por Fuente" (con fondo morado)
   - ✅ Selector "¿De dónde sale el dinero?" en formulario de egresos
   - ✅ Indicador de fuente en cada tarjeta de egreso

---

## ⚠️ IMPORTANTE - EGRESOS ANTERIORES

### Si ya tienes egresos registrados:

Los egresos que registraste **antes** de esta actualización **NO tienen asignada una fuente**. El sistema los tratará así:

- **Por defecto:** Se asumen como "Ofrendas Solidarias"

**¿Qué hacer?**

**Opción A - Editarlos uno por uno:**
1. Edita cada egreso antiguo
2. El sistema te preguntará de qué fuente salió
3. Asigna la fuente correcta

**Opción B - Eliminarlos y volver a crearlos:**
1. Anota los datos de cada egreso
2. Elimínalos
3. Créalos de nuevo seleccionando la fuente correcta

---

## 💡 CONSEJO IMPORTANTE

Para llegar a que **AMBOS saldos queden en $0**, tienes dos opciones:

**Opción 1: Registrar egresos individuales**
- Registra $5.403.400 de Ofrendas → Saldo Ofrendas = $0
- Registra $342.000 de Aportes → Saldo Aportes = $0

**Opción 2: Múltiples egresos más pequeños**
- Registra $3.000.000 de Ofrendas
- Registra $2.403.400 de Ofrendas
- Registra $342.000 de Aportes
- Resultado: Ambos saldos = $0

---

## 📊 Estructura de Datos

### Colección "Egresos" (Actualizada)
```javascript
{
  fecha: "2025-02-13",
  diaSemana: "Jueves",
  concepto: "Pago de luz",
  descripcion: "Luz oficina central",
  monto: 50000,
  fuenteEgreso: "ofrendasSolidarias", // 🆕 NUEVO CAMPO
  creadoEn: "2025-02-13T10:30:00Z"
}
```

**Valores posibles para `fuenteEgreso`:**
- `"ofrendasSolidarias"` - El egreso salió de Ofrendas Solidarias
- `"aportesIndividuales"` - El egreso salió de Aportes Individuales

---

## 🔍 EJEMPLO VISUAL

### ANTES de la actualización:
```
Solo veías:
- Total Ingresos: $5.745.400
- Total Egresos: $5.745.400
- Saldo: $0

❓ Pero no sabías de dónde salieron los $5.745.400
```

### DESPUÉS de la actualización:
```
Arriba (Histórico - NUNCA cambia):
- Ofrendas (histórico): $5.403.400
- Aportes (histórico): $342.000

Abajo (Disponible - SÍ cambia):
- ⛪ Ofrendas disponibles: $0
  (porque sacaste toda la ofrenda)
- 👤 Aportes disponibles: $0
  (porque sacaste todos los aportes)

✅ Ahora sabes exactamente de dónde salió cada peso
```

---

## ✅ Verificación Post-Instalación

Después de subir los archivos, verifica:

1. **Nueva sección morada visible:**
   - Título: "💼 Saldo Disponible Actual por Fuente"
   - Dos cajas: Ofrendas y Aportes

2. **Selector de fuente en formulario:**
   - Campo: "💼 ¿De dónde sale el dinero?"
   - Opciones: Ofrendas Solidarias / Aportes Individuales

3. **Los saldos se calculan correctamente:**
   - Histórico arriba NO cambia
   - Disponible abajo SÍ se resta con cada egreso

---

**Iglesia Pentecostal Unida de Colombia**  
Sistema actualizado a v3.2 - Control de Egresos con Fuentes Discriminadas  
Base de Datos: donaciones-54419

**✅ Tus datos están seguros - Esta actualización solo AGREGA funcionalidad**
