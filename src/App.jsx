import React, { useEffect, useMemo, useRef, useState } from 'react'
import API, { logout } from './api.js'
import KPI from './components/KPI.jsx'
import ControlChart from './components/ControlChart.jsx'
import Histogram from './components/Histogram.jsx'
import Pareto from './components/Pareto.jsx'
import ScrapTrend from './components/ScrapTrend.jsx'
import CapabilityTrend from './components/CapabilityTrend.jsx'
import ProductionEntry from './components/ProductionEntry.jsx'
import DataManager from './components/DataManager.jsx'
import { exportDashboard } from './utils/exportPDF'   // ← añadido

const DIM_OPTS = {
  real: [
    { value: 'promedio', label: 'Ciclo promedio (s)' },
    { value: 'th',       label: 'Tubos por hora' }
  ],
  demo: [
    { value: 'diameter_mm',  label: 'Diámetro (mm)' },
    { value: 'thickness_mm', label: 'Espesor (mm)' },
    { value: 'weight_g',     label: 'Peso (g)' }
  ]
}

const DEFAULT_LIMITS = {
  real: {
    promedio: { lsl: 30, usl: 90 },
    th:       { lsl: 40, usl: 80 }
  },
  demo: {
    diameter_mm:  { lsl: 15.5, usl: 16.5 },
    thickness_mm: { lsl: 2.30, usl: 2.70 },
    weight_g:     { lsl: 110,  usl: 130 }
  }
}

export default function App () {
  const [backendMode, setBackendMode] = useState(null)
  const [uiMode, setUiMode] = useState(null)

  const [dim, setDim] = useState('promedio')
  const [lsl, setLsl] = useState(30)
  const [usl, setUsl] = useState(90)
  const [cap, setCap] = useState(null)
  const [refresh, setRefresh] = useState(0)

  const [producto, setProducto] = useState('1')
  const [linea, setLinea]       = useState('1')

  // --- Filtros de fecha (últimos 30 días por defecto) ---
  const today = new Date()
  const _to = today.toISOString().slice(0,10)
  const d30 = new Date(today); d30.setDate(d30.getDate() - 30)
  const _from = d30.toISOString().slice(0,10)

  const [fromDate, setFromDate] = useState(_from)
  const [toDate, setToDate]     = useState(_to)

  // disparador para forzar refetch en hijos cuando se pulsa "Aplicar"
  const [dateBump, setDateBump] = useState(0)

  const [showEntry, setShowEntry] = useState(false)
  const [showManager, setShowManager] = useState(false)

  // ← ref del área que queremos exportar
  const exportAreaRef = useRef(null)

  const fmt = (x, d) => (x !== undefined && x !== null && !Number.isNaN(x) ? Number(x).toFixed(d) : '—')

  const fetchHealth = async () => {
    try {
      const r = await API.get('/health/')
      const detected = r.data && r.data.use_ext_schema ? 'real' : 'demo'
      setBackendMode(detected)
      setUiMode('real')  
    } catch {
      setBackendMode(null)
      setUiMode(prev => prev ?? 'demo')
    }
  }

  useEffect(() => { fetchHealth() }, [])

  useEffect(() => {
    if (!uiMode) return
    const firstDim = DIM_OPTS[uiMode][0].value
    setDim(firstDim)
    const limits = DEFAULT_LIMITS[uiMode][firstDim]
    setLsl(limits.lsl); setUsl(limits.usl)
  }, [uiMode])

  useEffect(() => {
    if (!uiMode) return
    const limits = DEFAULT_LIMITS[uiMode][dim] || { lsl, usl }
    setLsl(limits.lsl); setUsl(limits.usl)
  }, [dim, uiMode])

  useEffect(() => {
    if (!uiMode || !dim) return
    const run = async () => {
      try {
        const modeParam  = `mode=${uiMode}`
        const dateParams = `&from=${fromDate}&to=${toDate}`
        let url
        if (uiMode === 'real') {
          url = `/metrics/capability/?dimension=${dim}&lsl=${lsl}&usl=${usl}&n=200&producto=${producto}&linea=${linea}${dateParams}&${modeParam}`
        } else {
          url = `/metrics/capability/?dimension=${dim}&lsl=${lsl}&usl=${usl}&n=200${dateParams}&${modeParam}`
        }
        const r = await API.get(url)
        setCap(r.data)
      } catch (e) {
        console.error('Error capability:', e)
      }
    }
    run()
  }, [uiMode, dim, lsl, usl, producto, linea, refresh, fromDate, toDate])

  const dimOptions = useMemo(() => (uiMode ? DIM_OPTS[uiMode] : []), [uiMode])
  const mismatch = backendMode && uiMode && backendMode !== uiMode

  return (
    <div className="container">
      {/* Barra superior con botón de cierre de sesión */}
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        gap: 12,
        marginBottom: 12
      }}>
        <div style={{fontWeight:600}}>Dashboard Six Sigma</div>

        <button
          onClick={() => setShowEntry(true)}
          style={{
            padding:'8px 12px',
            borderRadius:8,
            border:'1px solid #374151',
            background:'#111827',
            color:'#e5e7eb',
            cursor:'pointer',
            marginRight:8
          }}
        >
          Ingresar producción
        </button>

        <button
          onClick={() => setShowManager(true)}
          style={{
            padding:'8px 12px',
            borderRadius:8,
            border:'1px solid #374151',
            background:'#111827',
            color:'#e5e7eb',
            cursor:'pointer',
            marginRight:8
          }}
        >
          Revisar / editar datos
        </button>

        {/* Botón Exportar PDF — NUEVO */}
        <button
          onClick={() =>
            exportDashboard(exportAreaRef.current, {
              fromDate, toDate, dim, producto, linea, uiMode
            })
          }
          style={{
            padding:'8px 12px',
            borderRadius:8,
            border:'1px solid #374151',
            background:'#0b3b0b',
            color:'#e5e7eb',
            cursor:'pointer',
            marginRight:8
          }}
          title="Exportar el dashboard a PDF"
        >
          Exportar PDF
        </button>

        <button
          onClick={() => { logout(); window.location.href = '/login'; }}
          style={{
            padding:'8px 12px',
            borderRadius:8,
            border:'1px solid #374151',
            background:'#0f172a',
            color:'#e5e7eb',
            cursor:'pointer'
          }}
          title="Cerrar sesión"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="header">
        <h1>Six Sigma — Gerfor Guatemala</h1>
      </div>

      {/* ==== ÁREA A EXPORTAR (inicio) ==== */}
      <div ref={exportAreaRef}>

        <div className="panel controls" style={{marginBottom:12}}>
          <strong>Modo backend detectado:</strong>
          <span className="badge" style={{background: backendMode==='real' ? '#064e3b' : '#312e81'}}>
            {backendMode ?? 'desconocido'}
          </span>
          <button className="btn" onClick={fetchHealth}>Refrescar estado backend</button>

          <div style={{width:16}} />

          <strong>Modo de la interfaz:</strong>
          <span className="badge" style={{background: uiMode==='real' ? '#14532d' : '#3730a3'}}>
            {uiMode ?? '...'}
          </span>
          <button className="btn primary" onClick={() => setUiMode(prev => prev === 'real' ? 'demo' : 'real')}>
            Cambiar a modo {uiMode === 'real' ? 'demo' : 'real'}
          </button>
        </div>

        {/* === Filtros de fecha (calendario) === */}
        <div className="panel controls" style={{marginBottom:16, display:'flex', flexWrap:'wrap', alignItems:'end', gap:12}}>
          <div style={{display:'flex', flexDirection:'column'}}>
            <label style={{color:'#0b0c0cff', fontSize:12}}>Desde</label>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={e => setFromDate(e.target.value)}
              style={{padding:8, borderRadius:8, border:'1px solid #374151', background:'#111827', color:'#e5e7eb'}}
            />
          </div>
          <div style={{display:'flex', flexDirection:'column'}}>
            <label style={{color:'#0b0c0cff', fontSize:12}}>Hasta</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              onChange={e => setToDate(e.target.value)}
              style={{padding:8, borderRadius:8, border:'1px solid #374151', background:'#111827', color:'#e5e7eb'}}
            />
          </div>

          <button
            onClick={() => setDateBump(x => x + 1)}
            className="btn primary"
          >
            Aplicar
          </button>

          <button
            onClick={() => {
              const t = new Date()
              const to = t.toISOString().slice(0,10)
              const f = new Date(t); f.setDate(f.getDate() - 30)
              const from = f.toISOString().slice(0,10)
              setFromDate(from); setToDate(to); setDateBump(x => x + 1)
            }}
            className="btn ghost"
          >
            Últimos 30 días
          </button>
        </div>

        <div className="panel controls" style={{marginBottom:16}}>
          <label>Dimensión:</label>
          <select className="select" value={dim} onChange={e=>setDim(e.target.value)}>
            {dimOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <label>LSL</label>
          <input className="input" type="number" step="0.01" value={lsl} onChange={e=>setLsl(Number(e.target.value))} style={{width:100}}/>

          <label>USL</label>
          <input className="input" type="number" step="0.01" value={usl} onChange={e=>setUsl(Number(e.target.value))} style={{width:100}}/>

          {uiMode === 'real' && (
            <>
              <label>Producto (id)</label>
              <input className="input" type="number" value={producto} onChange={e=>setProducto(e.target.value)} style={{width:90}}/>
              <label>Línea (id)</label>
              <input className="input" type="number" value={linea} onChange={e=>setLinea(e.target.value)} style={{width:90}}/>
            </>
          )}

          <button className="btn ghost" onClick={()=>window.location.reload()}>Reiniciar</button>
          <button className="btn primary" onClick={()=>setRefresh(r=>r+1)} style={{marginLeft:8}}>Calcular</button>
        </div>
        
        <div className="grid-4">
          <KPI
            label="μ (Media aritmética de la muestra)"
            value={fmt(cap && cap.mu, 3)}
          />
          <KPI
            label="σ (Desviación estándar de la muestra)"
            value={fmt(cap && cap.s_sample, 4)}
          />
          <KPI
            label="Cp (Índice de Capacidad Potencial del Proceso)"
            value={fmt(cap && cap.cp, 3)}
          />
          <KPI
            label="Cpk (Índice de Capacidad Real del Proceso)"
            value={fmt(cap && cap.cpk, 3)}
          />
        </div>

        <div className="grid-2-1" style={{marginTop:16}}>
          <div>
            <h3 style={{margin:'8px 0'}}>X̄ - R</h3>
            <ControlChart dim={dim} uiMode={uiMode} refresh={refresh}
              from={fromDate} to={toDate} bump={dateBump} />
          </div>
          <div>
            <h3 style={{margin:'8px 0'}}>Histograma</h3>
            <Histogram dim={dim} uiMode={uiMode} refresh={refresh}
              from={fromDate} to={toDate} bump={dateBump} />
          </div>
        </div>

        <div style={{marginTop:16}}>
          <h3 style={{margin:'8px 0'}}>Pareto de Defectos</h3>
          <Pareto uiMode={uiMode} refresh={refresh}
            from={fromDate} to={toDate} bump={dateBump} />
        </div>

        <div style={{marginTop:16}}>
          <h3 style={{margin:'8px 0'}}>Tendencia de Yield y Sigma (SCRAP)</h3>
          <ScrapTrend from={fromDate} to={toDate} opp={1} refresh={refresh} bump={dateBump} />
        </div>

        <div style={{marginTop:16, marginBottom:24}}>
          <h3 style={{margin:'8px 0'}}>Tendencia de Cp/Cpk/Sigma</h3>
          <CapabilityTrend
            producto={producto}
            linea={linea}
            refresh={refresh}
            from={fromDate}
            to={toDate}
            bump={dateBump}
          />
        </div>

      </div>
      {/* ==== ÁREA A EXPORTAR (fin) ==== */}

      <DataManager
        open={showManager}
        onClose={() => setShowManager(false)}
        onChanged={() => { setRefresh(r=>r+1); setDateBump(x=>x+1); }}
        defaultFecha={fromDate}
        defaultProducto={producto}
        defaultLinea={linea}
      />

      <ProductionEntry
        open={showEntry}
        onClose={() => setShowEntry(false)}
        onSaved={() => { setRefresh(r => r + 1); setDateBump(x => x + 1); }}
        defaultFecha={fromDate}
        defaultProducto={producto}
        defaultLinea={linea}
        defaultDimension={dim}
      />
    </div>
  )
}
