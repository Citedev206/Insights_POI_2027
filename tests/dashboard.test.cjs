const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
// DATA_ROOT permite probar con otra carpeta de datos (p. ej. ejecución simulada).
const dataRoot = process.env.DATA_ROOT ? path.resolve(process.env.DATA_ROOT) : root;
const XLSX = require(path.join(root, 'js/lib/xlsx.full.min.js'));
const ctx = { console, XLSX, Date, Set, Map, Intl, setTimeout,
  document: { addEventListener() {} }, addEventListener() {},
  fetch: async (url) => {
    const file = path.join(dataRoot, url);
    return { ok: fs.existsSync(file), status: fs.existsSync(file) ? 200 : 404,
      arrayBuffer: async () => { const b = fs.readFileSync(file); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } };
  }
};
ctx.window = ctx;
vm.createContext(ctx);
for (const name of ['data', 'metrics', 'charts']) vm.runInContext(fs.readFileSync(path.join(root, `js/${name}.js`), 'utf8'), ctx);
// Expose renderers only inside this test context; production API stays unchanged.
vm.runInContext(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8').replace('  // ---- ARRANQUE', '  // ---- ARRANQUE').replace('  window.addEventListener("hashchange"', '  global.testDashboard = { setStore(v) { STORE = v; }, FILTER, VIEWS, metasClientesComparables, selectService(v) { svcTareaFiltro = v; }, selectComplexity(v) { svcComplejidadFiltro = v; }, exportData() { return lastExport; } };\n  window.addEventListener("hashchange"'), ctx);
(async () => {
  const data = await ctx.POI.data.loadAll();
  const { metrics: m, data: d } = ctx.POI;
  const app = ctx.testDashboard;
  app.setStore(data);
  const filter = app.FILTER;
  const expectedClients = new Set(data.ejecucion.map(r => r.RUC).filter(Boolean)).size;
  assert.equal(m.kpisClientes(data.ejecucion, []).ejec_clientes, expectedClients);
  assert.equal(d.filtrarClientes(data, filter).length, data.clientes.length, 'Todos incluye metas de todos los programas');
  const blank = [{ RUC: null, CANTIDAD: 1 }, { RUC: '', CANTIDAD: 1 }];
  assert.equal(m.kpisClientes(blank, []).ejec_clientes, 0);
  assert.equal(m.clientesResumen(blank, []).total, 0);
  assert.equal(m.clientesResumen(data.ejecucion, []).nuevos, 0, 'Sin histórico no se inventan nuevos');
  const allocation = m.clientesMetaEspecialistas([], new Set(['A', 'B', 'C']), 5, 7);
  assert.ok(Math.abs(allocation.rows.reduce((n,r) => n+r.metaFoc,0)-5) < 1e-9, 'Reparto conserva la meta');
  const compensated = m.balanceServicios([{Meta:100, Ejecutado:150}, {Meta:100, Ejecutado:50}]);
  assert.equal(compensated.avance, 100);
  assert.equal(compensated.cobertura, 75);
  assert.equal(compensated.pendiente, 50);
  assert.equal(compensated.excedente, 50);
  const unequal = m.balanceServicios([{Meta:900, Ejecutado:900}, {Meta:100, Ejecutado:0}]);
  assert.equal(unequal.cobertura, 90, 'Peso por meta, no promedio simple de 50%');
  const noTarget = m.balanceServicios([{Meta:0, Ejecutado:20}]);
  assert.equal(noTarget.cobertura, null);
  assert.equal(noTarget.avance, null);
  assert.equal(noTarget.sinMeta, 20);
  assert.equal(noTarget.excedente, 0);
  const mixed = m.balanceServicios([{Meta:100, Ejecutado:50}, {Meta:0, Ejecutado:100}]);
  assert.equal(mixed.avance, 150);
  assert.equal(mixed.cobertura, 50);
  assert.equal(m.balanceServicios([{Meta:100, Ejecutado:0}]).cobertura, 0);
  // --- 2027: reparto de metas por especialista y cuadro de control ---
  const sum = (rows, col) => rows.reduce((n, r) => n + (Number(r[col]) || 0), 0);
  assert.ok(Math.abs(sum(data.metas, 'META_CANTIDAD') - sum(data.metasBase, 'META_CANTIDAD')) < 1e-6, 'El reparto por especialista conserva la meta total');
  const byTask = new Map();
  data.metas.forEach(r => { const k = m.normKey(r.TIPO_TAREA) + '|' + r.MES; byTask.set(k, (byTask.get(k) || 0) + r.META_CANTIDAD); });
  data.metasBase.forEach(r => { const k = m.normKey(r.TIPO_TAREA) + '|' + r.MES; assert.ok(Math.abs((byTask.get(k) || 0) - sumBase(k)) < 1e-6, 'Reparto conserva la meta por tarea y mes ' + k); });
  function sumBase(k) { return data.metasBase.filter(r => m.normKey(r.TIPO_TAREA) + '|' + r.MES === k).reduce((n, r) => n + r.META_CANTIDAD, 0); }
  const cc = m.cuadroControl(data.ejecucion, data.metas);
  assert.ok(Math.abs(cc.meta - sum(data.metas, 'META_CANTIDAD')) < 1e-6, 'Cuadro de control suma la meta');
  assert.equal(Math.round(cc.ejec), Math.round(sum(data.ejecucion, 'CANTIDAD')), 'Cuadro de control suma la ejecución');
  const codes = cc.servicios.map(s => s.servicio);
  assert.deepEqual(codes, codes.slice().sort(m.byCode), 'Servicios en orden de catálogo');
  const corte = m.mesCorte(data.ejecucion);
  if (!corte) {
    const html = app.VIEWS.ejecutivo.render();
    assert.ok(html.includes('Fase de planificación'), 'Sin ejecución se muestra la fase de planificación');
    assert.ok(!/En riesgo<\/span>/.test(html.replace(/legend[\s\S]*?<\/div>/g, '')), 'En planificación no se marca a nadie en riesgo');
  }
  const serviceTypes = [...new Set(data.ejecucion.map(r => m.normKey(r.TIPO_SERVICIO)))];
  for (const service of serviceTypes) {
    app.selectService(service);
    const html = app.VIEWS.servicios.render();
    const records = data.ejecucion.filter(r => m.normKey(r.TIPO_SERVICIO) === service);
    const total = records.reduce((n,r) => n+r.CANTIDAD,0);
    assert.ok(html.includes(`${ctx.POI.charts.fmt(total)}</div>`), 'KPI usa cantidades del servicio seleccionado');
    assert.ok(html.includes('selected>'+ctx.POI.charts.esc(service)), 'Selector conserva su valor');
  }
  app.selectService(null);
  for (const complexity of ctx.POI.CFG.COMPLEJIDADES) {
    for (const service of [null, ...serviceTypes]) {
      app.selectComplexity(complexity);
      app.selectService(service);
      const html = app.VIEWS.servicios.render();
      const selected = data.ejecucion.filter(r => r.COMPLEJIDAD === complexity && (!service || m.normKey(r.TIPO_SERVICIO) === service));
      const selectedMeta = data.metas.filter(r => r.COMPLEJIDAD === complexity && (!service || m.normKey(r.TIPO_SERVICIO) === service) && (!corte || r.MES <= corte));
      const expected = selected.reduce((n,r) => n+r.CANTIDAD,0);
      if (corte) assert.ok(html.includes(`${ctx.POI.charts.fmt(expected)}</div>`), 'KPI respeta servicio y complejidad');
      const exported = app.exportData();
      assert.equal(exported.rows.reduce((n,r) => n+r[2],0), expected, 'CSV coincide con el filtro');
      assert.ok(Math.abs(exported.rows.reduce((n,r) => n+r[1],0) - selectedMeta.reduce((n,r) => n+r.META_CANTIDAD,0)) < 1e-6);
      assert.ok(exported.rows.every(r => r[9] === complexity));
    }
  }
  app.selectComplexity(null);
  app.selectService(null);

  const programs = [...new Set([...data.ejecucion, ...data.metas].map(r => r.PROGRAMA))];
  let renders = 0;
  for (const program of [null, ...programs]) {
    filter.programas = program ? [program] : [];
    for (const month of [null, 1, 12]) {
      filter.meses = month ? [month] : [];
      for (const name of Object.keys(app.VIEWS)) {
        const html = app.VIEWS[name].render();
        assert.equal(typeof html, 'string');
        assert.ok(!/NaN|Infinity|undefined%/.test(html), `${name}: cifras inválidas`);
        renders++;
      }
    }
  }
  filter.programas = []; filter.meses = [];
  filter.especialistas = [(data.ejecucion[0] || data.metas[0]).ESPECIALISTA];
  assert.equal(app.metasClientesComparables(data.ejecucion).length, 0, 'Sin comparación institucional para especialista');
  filter.especialistas = [];
  const totals = m.kpis(data.ejecucion, data.metas);
  console.log(JSON.stringify({ renders, clients: expectedClients, services: totals.ejecutado, target: totals.meta, compliance: totals.cumplimiento, programs, serviceBalance: m.balanceServicios(m.metaVsEjec(data.ejecucion, data.metas, "TIPO_SERVICIO", "TIPO_SERVICIO")) }));
})().catch(e => { console.error(e); process.exitCode = 1; });
