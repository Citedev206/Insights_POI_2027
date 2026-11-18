# CITE · Control de ejecución POI 2027

Tablero de **control de la ejecución de servicios, clientes y metas** del POI 2027
del CITE Textil Camélidos Cusco: cuadro de ejecución por servicio y tarea, metas por
especialista y mes, clientes (nuevos / reenganchados / focalizados) e intervenciones
financiadas por **World Vision**.

🔗 **https://citedev206.github.io/Insights_POI_2027/** (p. ej. `#ejecutivo`, `#servicios`, `#especialistas`, `#clientes`, `#calendario`)

Es un **sitio estático** (HTML + CSS + JavaScript) que lee los Excel de `data/`
directamente en el navegador: se actualiza reemplazando los archivos de `data/`
y haciendo `git push`, sin tocar el código.

---

## 🗓️ Fases del año

| Fase | Cuándo | Qué muestra |
|---|---|---|
| **Planificación** | `ejecucion.xlsx` sin filas (situación actual) | Metas programadas por servicio, tarea, especialista y mes. Sin semáforos (no se marca a nadie "en riesgo"). Banner "Fase de planificación 2027". |
| **Ejecución** | desde la primera fila de `ejecucion.xlsx` | Ejecutado vs **meta acumulada al mes de corte** (último mes con ejecución). Los meses siguientes siguen mostrando su meta en gris. |

> El "mes de corte" evita que en marzo aparezca "en riesgo" un avance que va al
> día: se compara contra la meta Ene–Mar y no contra la meta de todo el año.
> La meta anual se sigue mostrando como referencia.

## 🧭 Vistas (en este orden)

1. **Resumen** (`#ejecutivo`): indicadores clave, **cuadro de ejecución** (tipo de
   servicio → tarea × mes, en orden de catálogo 1.→8.; clic en un servicio para
   plegar sus tareas), avance mensual, peso/avance por tipo de servicio y detalle
   por especialista. *Exportar* descarga el cuadro en CSV.
2. **Servicios**: meta / avance y cobertura ponderada por tipo de servicio y tarea,
   con filtro de complejidad.
3. **Especialistas**: tabla **especialista × mes** (meta, o ejecutado/meta),
   heatmap tarea × mes, evolución y referencia de clientes por especialista.
4. **Clientes**: metas de clientes por mes (planificación) o padrón, focalización
   y antigüedad (ejecución).
5. **World Vision** (`#calendario`): servicios POI con `FINANCIADO = WORLDVISION`
   (resumen, calendario por RUC y salidas por especialista). Se llena sola cuando
   aparezcan esas filas en `ejecucion.xlsx`.
6. *Programas* y *CdD-FEST* solo aparecen si los datos traen más de un programa
   o filas de CdD-FEST (en 2027 el POI es el único programa con metas).

## 👥 Metas por especialista (`data/asignacion.xlsx`)

`metas.xlsx` trae la meta **por tarea y mes**, sin especialista. El reparto se
define en `asignacion.xlsx`:

* Hoja **ASIGNACION**: una fila por tarea, una columna por especialista con el
  **% de la meta** de esa tarea que le toca (celdas amarillas). `TOTAL_%` debe
  quedar en 100 % (verde); `ESTADO` dice OK / FALTA / EXCEDE / SIN ASIGNAR.
* El tablero reparte la meta de **cada mes** con esos % y muestra lo que falte
  como **"SIN ASIGNAR"** (fila destacada en ámbar).
* Hojas de apoyo con fórmulas: `METAS_2027` (copia de metas.xlsx),
  `META_ESPECIALISTA_MES` y `META_TAREA_ESPECIALISTA`. Instrucciones en `LEEME`.
* Los % iniciales son una **propuesta** basada en el reparto de metas POI 2026
  (o la ejecución 2026 si la tarea no tuvo meta). Hay que revisarlos.
* Si una meta ya tiene responsable exacto, se puede escribir directamente en
  `metas.xlsx` llenando `ESPECIALISTA`: esas filas no se reparten.

## 🔗 Publicar en GitHub Pages

1. Crear en GitHub el repositorio **`Citedev206/Insights_POI_2027`** (vacío).
2. Desde esta carpeta (el remoto `origin` ya apunta a ese repositorio):
   ```bash
   git add -A
   git commit -m "POI 2027: planificación, cuadro de ejecución y metas por especialista"
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Deploy from a branch** · `main` · `/ (root)`.
4. En 1–2 minutos queda en `https://citedev206.github.io/Insights_POI_2027/`.

> `.nojekyll` (incluido) evita que GitHub procese el sitio con Jekyll.

## 🔄 Actualizar los datos (flujo sin código)

```bash
# 1) Reemplaza/edita los Excel en data/ (mismos nombres y columnas)
git add data/
git commit -m "Actualiza datos POI 2027"
git push
```

## 🖥️ Vista previa local

```bash
python -m http.server 8000      # y abre http://localhost:8000
```

Validación de cálculos: `node tests/dashboard.test.cjs` (con
`DATA_ROOT=<otra carpeta>` se prueba con otros datos, p. ej. una ejecución simulada).

## 📁 Estructura

```
├── index.html            # App (riel de navegación, header, filtros)
├── css/styles.css        # Sistema de diseño (tokens de color y tipografía)
├── js/
│   ├── lib/xlsx.full.min.js   # SheetJS
│   ├── data.js           # Carga, validación por cabeceras y reparto de metas
│   ├── metrics.js        # Reglas: corte, cuadro de control, clientes, etc.
│   ├── charts.js         # Gráficos SVG
│   └── app.js            # Vistas, filtros y exportación
└── data/
    ├── metas.xlsx        # Meta por tarea y mes (obligatorio)
    ├── ejecucion.xlsx    # Ejecución (obligatorio; puede estar vacío = planificación)
    ├── asignacion.xlsx   # % de la meta por especialista (opcional, recomendado)
    ├── clientes.xlsx     # Meta de clientes por mes y tipo (opcional)
    ├── focalizados.xlsx  # Empresas focalizadas 2027 (plantilla, completar)
    └── bd.xlsx           # Histórico de atención AÑO/RUC (hoy: 2026)
```

## 📊 Modelo de datos (columnas exactas)

* **ejecucion.xlsx**: `ID_ACTIVIDAD, FECHA, AÑO, MES, PROGRAMA, ESPECIALISTA, RUC,
  RAZON_SOCIAL, TIPO_CONTRIBUYENTE, TIPO_SERVICIO, TIPO_TAREA, TEMA_ABORDADO,
  COMPLEJIDAD, CANTIDAD, FUENTE, COMPONENTE, FINANCIADO, FECHA_I`.
  World Vision: `FINANCIADO = WORLDVISION`, `FECHA_I` = inicio, `FECHA` = fin.
* **metas.xlsx**: `ID_META, AÑO, MES, PROGRAMA, ESPECIALISTA (puede ir vacío),
  TIPO_SERVICIO, COMPLEJIDAD, TIPO_TAREA, META_CANTIDAD`
* **asignacion.xlsx** (hoja `ASIGNACION`): `TIPO_SERVICIO, TIPO_TAREA, META_2027,
  <ESPECIALISTA 1> … <ESPECIALISTA n>, TOTAL_%, ESTADO, BASE_PROPUESTA`
* **clientes.xlsx**: `MES, PROGRAMA, TIPO (FOCALIZADO / NO FOCALIZADO), META`
* **focalizados.xlsx**: `RUC, RAZON_SOCIAL, TIPO`
* **bd.xlsx**: `AÑO, RUC, RAZON_SOCIAL` (histórico; agregar años anteriores mejora
  la clasificación de nuevos/reenganchados)

> Las cabeceras se validan aunque el archivo no tenga filas. Los nombres de
> especialista deben escribirse igual en `asignacion.xlsx` y `ejecucion.xlsx`.

## 🧮 Reglas implementadas

* Cumplimiento a la fecha = ejecutado ÷ meta acumulada hasta el mes de corte.
* Semáforo: 🟩 ≥100 % · 🟨 80–99 % · 🟧 50–79 % · 🟥 <50 %.
* Servicios y tareas siempre en **orden de catálogo** (1.2, 1.3 … 8.9).
* Focalizados se cruzan por RUC. Clientes: **nuevo** = sin historial + complejidad
  media/alta; **reenganchado** = atendido antes pero sin servicio en los 3 años
  previos (2024–2026) + media/alta; **recurrente** = resto.
* Un **único filtro global** (Programa · Mes · Especialista) alimenta todas las
  vistas excepto World Vision y CdD-FEST.

## 🎨 Identidad visual

Ciruela institucional (`#4A1A4E` / `#7B2D80`), verde azulado complementario
(`#0E7C86`) para clientes y dorado fibra (`#B07F22`) para focalizados; semáforo
verde/ámbar/naranja/rojo. Tipografía **Inter** (texto, números tabulares) y
**Plus Jakarta Sans** (títulos y cifras grandes). Los tokens están en `:root` de
`css/styles.css` y en `COL` de `js/charts.js`.

---

## Módulos heredados de 2026

### 🧭 Planificador CdD-FEST (se muestra solo si hay datos de CdD-FEST)

Pestaña dedicada (independiente de los filtros globales, con su propio
buscador de Unidad Productiva por RUC o razón social). Solo aparecen las UP
**realmente atendidas por CdD-FEST**: aquellas con el componente **1.1**
(Medición del Índice de Competitividad) **ejecutado** en `ejecucion.xlsx`.
Tener una fila en `results_ice.xlsx` no basta por sí sola para aparecer en
la lista (puede ser un diagnóstico externo sin visita real); si una UP fue
atendida (1.1 ejecutado) pero aún no tiene fila en `results_ice.xlsx`,
aparece en el buscador con el estado "Diagnóstico ICE pendiente". Tiene dos
modos (pestañas):

### Por Unidad Productiva

* **Radar ICE** (8 dimensiones) con el diagnóstico de `results_ice.xlsx`.
* **Orden recomendado de intervención**: C1 es la línea base (el propio
  diagnóstico, siempre primero). Entre los componentes C2–C5 **todavía
  pendientes**, se prioriza el de **MENOR brecha promedio** (el más cerca de
  estar listo) — no el de mayor brecha. Así se evita recomendar saltar a un
  componente avanzado (p. ej. C5 Comercio Exterior, que suele partir con
  brechas muy altas en casi todas las UP) mientras uno anterior (p. ej. C4
  Digitalización) todavía tiene una brecha grande sin resolver; y si una UP
  puntual ya está bien encaminada en un componente avanzado, ese sí sube de
  prioridad. Los componentes ya completados o programados no compiten por
  prioridad: se muestran después, en su orden natural C2→C5. Mapeo componente
  → dimensión ICE: C2 Gestión Empresarial → Gestión Organizacional +
  Financiera y Tributaria · C3 Mejora de procesos → Gestión Productiva ·
  C4 Digitalización y Packaging → Tecnología e Innovación + Marketing ·
  C5 Comercio Exterior → Comercio Exterior. Sostenibilidad y Ecosistema de
  Influencia se ven en el radar como contexto, sin priorizar un componente.
* **Línea de tiempo**: cruza lo ejecutado (`ejecucion.xlsx` → `COMPONENTE`)
  con lo programado (`programado.xlsx` → `RUC`+`COMPONENTE`), coloreado por
  componente (sólido = ejecutado, trama diagonal = solo programado). Cada
  intervención muestra especialista, tema/servicio y una etiqueta de
  **duración esperada** (informativa): "asistencia técnica" ≥ 7 h, "diseño"
  3–4 h — no reprograma fechas ni asigna horarios automáticamente.
* **Estado por componente** (C1–C5): completado / parcial / programado /
  pendiente (ver regla de "completado" abajo), con el **desglose por
  actividad exacta** (columna "Actividades": ✓ ejecutada, ◐ solo programada,
  ○ pendiente, junto al **especialista responsable** y la **meta
  institucional** de esa actividad entre paréntesis — p. ej. "✓ 3.4 · Erika
  Turpo (27)" — según `CFG.ACTIVIDADES` en `js/data.js`), especialista(s)
  asignado(s) al componente, última fecha ejecutada y próxima programada.

**Regla de "completado":** un componente con varias actividades (p. ej. C3
agrupa 3.1 a 3.7, C4 agrupa 4.1 a 4.3) solo cuenta como **Completado** cuando
**TODAS** sus actividades están ejecutadas para esa UP — no basta con una
sola. Si hay al menos una ejecutada pero no todas, el estado es **Parcial**
(se muestra como "Parcial x/y"); si ninguna está ejecutada pero hay alguna
programada, es "Programado"; si no hay ningún evento, "Pendiente". Los
componentes de una sola actividad (C1, C2, C5 en el catálogo actual) se
comportan igual que antes (ejecutar su única actividad ya los completa). El
**orden recomendado** trata "Parcial" igual que "Pendiente" (compite por
prioridad según brecha): un componente a medio hacer sigue necesitando
trabajo, no se da por atendido.

### Vista general

Todas las UP a la vez, **sin mezclar** el estado de un componente con otro:
una tarjeta por componente (C1–C5) con el conteo de UP completadas /
parciales / pendientes (misma regla de "completado" que arriba: todas las
actividades del componente) y una tabla-matriz (UP × C1–C5, buscable por
RUC o razón social, **ordenada por defecto por más componentes completados
primero**) para ver de un vistazo qué unidades productivas van más
adelantadas y cuáles fueron atendidas en cada componente.

Junto al título de cada tarjeta (p. ej. "C3") se muestra **`(completadas /
mínimo)`** — UP que ya completaron el componente frente a la **meta mínima
institucional** de su actividad de entrada (`MT.metaMinimaComponente` en
`js/metrics.js`, tomada de la meta de la actividad de código más bajo del
componente, p. ej. 3.1 para C3 — las siguientes actividades del mismo
componente son subconjuntos más específicos con metas menores). El estado
**"Programado" no se muestra por ahora** en estas tarjetas (se pliega dentro
de "Pendiente") porque el programa todavía no agenda por fechas; el dato
sigue calculándose internamente (`resumen.porComponente[g].programado`) y
solo está comentado en `viewCddFestGeneral()` de `js/app.js` — se puede
reactivar fácilmente cuando se retome la programación por fechas. El badge
"Programado" de la tabla-matriz (columnas C1–C5 por UP) no se tocó.

**Clic en cualquier fila de la tabla-matriz** expande, debajo, el desglose
de **actividad exacta por componente** para esa UP (mismo checklist ✓/◐/○
+ especialista responsable que en "Por Unidad Productiva"), para ver de un
vistazo qué actividad puntual falta y quién es el responsable dentro de un
componente marcado "Parcial". Un segundo clic en la misma fila lo cierra.

**Clic en cualquier tarjeta de componente** (p. ej. C3) abre su detalle a
nivel de **actividad exacta** (código decimal, p. ej. 3.1 vs 3.4 — un
componente puede agrupar varias actividades con especialistas distintos:
`CFG.ACTIVIDADES` en `js/data.js`), con un **botón por actividad** (con su
conteo de UP) — clic en uno filtra la tabla a solo esa actividad para verla
más limpia; un segundo clic la quita. Un segundo clic en la tarjeta del
componente cierra todo el detalle.

Una misma UP puede tomar **más de un servicio dentro de la misma
actividad** (p. ej. dos visitas de asistencia técnica en 3.4): la tabla y
el conteo de cada botón cuentan **UP únicas, no servicios** — cada UP
aparece una sola vez por actividad, con una columna **"Cant. servicios"**
indicando cuántos servicios se consolidaron en esa fila.

### Revisión de indicadores y experiencia de uso

- “Todos” incluye todos los programas tanto para servicios como para clientes y sus metas.
- Los clientes se cuentan por RUC no vacío. Un mismo cliente puede aparecer con varios especialistas; no se deben sumar esas filas para obtener el total institucional.
- Las metas de clientes se suman por mes y programa; no equivalen necesariamente a una meta anual de clientes únicos. Al filtrar especialistas se oculta la comparación con la meta institucional. Si falta cobertura de metas para algún programa atendido, también se omite esa comparación.
- La tabla de referencia de clientes por especialista usa solamente POI, conserva el equipo completo para repartir la meta y señala que el reparto es referencial. Las fracciones no se redondean hacia arriba.
- Sin histórico no se clasifican clientes como nuevos o reenganchados. El gráfico mensual describe primera atención o atención repetida dentro del período, que es un concepto distinto.
- Los porcentajes conservan un decimal para evitar que 79.5 % aparezca como 80 % con el estado de alerta.
- La exportación solo se habilita cuando la vista dispone de datos exportables. Los filtros se cierran con Escape y tienen indicadores de foco para teclado.

Validación local de cálculos y generación de vistas con los Excel actuales: `node tests/dashboard.test.cjs`.

En Especialistas → CdD-FEST, las UP únicas atendidas y la suma de metas por actividad se muestran en columnas separadas, sin barra ni porcentaje: una UP puede estar prevista para varias actividades y esas unidades no son directamente comparables.

### Servicios: volumen y cobertura ponderada

La sección separa el avance por volumen (`Σ ejecutado / Σ meta`) de la cobertura ponderada por tipo (`Σ min(ejecutado_tipo, meta_tipo) / Σ meta_tipo`). Cada tipo pesa según su meta; el aporte de cada tipo se limita al 100%. Así, los excedentes siguen visibles, pero no ocultan metas pendientes de otros tipos. La ejecución sin meta se informa aparte y solo se incluye en el volumen.

El selector de tipo aplica a toda la sección y a su CSV. El detalle por tarea recalcula la cobertura limitando cada tarea; por eso puede ser menor que la cobertura agrupada por tipo. La cantidad de servicios usa CANTIDAD, y el número de filas se identifica como registros. Se reemplazan los gráficos repetidos por barras de cobertura con cantidades, peso, pendiente y excedente. La complejidad se muestra al costado, con barras de meta y ejecución y una dona de composición. El detalle por tarea queda desplegable y las explicaciones se reducen a etiquetas breves.

El filtro de complejidad (Todas, Alta, Media, Baja) en Servicios se combina con el tipo de servicio y los filtros generales. Actualiza indicadores, servicios, tareas, gráficos de complejidad y exportación, según la clasificación registrada en los Excel. Las tareas se muestran en una sola columna.
