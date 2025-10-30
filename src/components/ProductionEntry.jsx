import React, { useMemo, useState } from 'react'
import API from '../api.js'

export default function ProductionEntry({
  open, onClose, onSaved,
  defaultFecha, defaultProducto='1', defaultLinea='1', defaultDimension='promedio'
}) {
  const [fecha, setFecha] = useState(defaultFecha || new Date().toISOString().slice(0,10))
  const [producto, setProducto] = useState(String(defaultProducto))
  const [linea, setLinea] = useState(String(defaultLinea))
  const [dimension, setDimension] = useState(defaultDimension) // 'promedio'|'th'
  const [muestras, setMuestras] = useState([{ value: '' }])
  const [totalProducido, setTotalProducido] = useState('')
  const [totalDefectuoso, setTotalDefectuoso] = useState('')
  const [defectos, setDefectos] = useState([{ id_defecto_tipo:'', cantidad:'' }])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [msg, setMsg] = useState(null)

  const canSave = useMemo(() =>
    fecha && producto && linea && dimension && !loading, [fecha, producto, linea, dimension, loading])

  if (!open) return null

  const addMuestra = () => setMuestras(a => [...a, { value:'' }])
  const delMuestra = (i) => setMuestras(a => a.filter((_,idx)=> idx!==i))
  const addDefecto = () => setDefectos(a => [...a, { id_defecto_tipo:'', cantidad:'' }])
  const delDefecto = (i) => setDefectos(a => a.filter((_,idx)=> idx!==i))

  const submit = async () => {
    setErr(null); setMsg(null)
    try {
      setLoading(true)
      const payload = {
        fecha,
        id_producto: Number(producto),
        id_linea: Number(linea),
        dimension,
        muestras: muestras.map(m => String(m.value).trim()).filter(v=>v!=='').map(Number),
        total_producido:  (totalProducido  === '' ? null : Number(totalProducido)),
        total_defectuoso: (totalDefectuoso === '' ? null : Number(totalDefectuoso)),
        defectos: defectos
          .filter(d => String(d.id_defecto_tipo).trim()!=='' && String(d.cantidad).trim()!=='')
          .map(d => ({ id_defecto_tipo:Number(d.id_defecto_tipo), cantidad:Number(d.cantidad) }))
      }
      await API.post('/ingreso/produccion/', payload)
      setMsg('Guardado correctamente.')
      onSaved && onSaved()
      setTimeout(() => onClose && onClose(), 500)
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.response?.data?.error || 'No se pudo guardar.')
    } finally {
      setLoading(false)
    }
  }

  // Atajos a variables CSS del tema claro (solo estilos; sin lógica)
  const c = {
    panel: 'var(--panel)',
    text: 'var(--text)',
    btnBg: 'var(--btn-bg)',
    btnText: 'var(--btn-text)',
    btnBorder: 'var(--btn-border)',
    ghostBg: 'var(--btn-ghost-bg)',
    ghostBorder: 'var(--btn-ghost-border)',
    primary: 'var(--primary)',
  }

  const inputStyle = {
    width:'100%', padding:10, borderRadius:12,
    border:`1px solid ${c.btnBorder}`, background:c.btnBg, color:c.btnText
  }

  const ghostBtn = {
    border:`1px solid ${c.ghostBorder}`, background:c.ghostBg,
    color:c.btnText, borderRadius:8, padding:'6px 10px', cursor:'pointer'
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,.35)',  // backdrop
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
    }}>
      <div style={{
        width:'min(980px,96vw)', maxHeight:'90vh', overflow:'auto',
        background:c.panel, border:`1px solid rgba(0,0,0,.12)`,
        borderRadius:16, padding:16, color:c.text,
        boxShadow:'0 20px 60px rgba(0,0,0,.18)'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <h3 style={{margin:0}}>Ingreso de producción</h3>
          <button onClick={onClose} style={ghostBtn}>Cerrar</button>
        </div>

        {/* Cabecera */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12}}>
          <div>
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
                   style={inputStyle}/>
          </div>
          <div>
            <label>Producto (id)</label>
            <input value={producto} onChange={e=>setProducto(e.target.value)}
                   style={inputStyle}/>
          </div>
          <div>
            <label>Línea (id)</label>
            <input value={linea} onChange={e=>setLinea(e.target.value)}
                   style={inputStyle}/>
          </div>
          <div>
            <label>Dimensión</label>
            <select value={dimension} onChange={e=>setDimension(e.target.value)}
                    style={inputStyle}>
              <option value="promedio">Ciclo promedio (s)</option>
              <option value="th">Tubos por hora</option>
            </select>
          </div>
        </div>

        {/* Muestras */}
        <div style={{marginTop:8}}>
          <h4 style={{margin:'8px 0'}}>Muestras ({dimension})</h4>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{textAlign:'left', padding:6, borderBottom:'1px solid rgba(0,0,0,.12)'}}>#</th>
                <th style={{textAlign:'left', padding:6, borderBottom:'1px solid rgba(0,0,0,.12)'}}>Valor</th>
                <th style={{textAlign:'left', padding:6, borderBottom:'1px solid rgba(0,0,0,.12)'}}></th>
              </tr>
            </thead>
            <tbody>
              {muestras.map((m,i)=>(
                <tr key={i}>
                  <td style={{padding:6}}>{i+1}</td>
                  <td style={{padding:6}}>
                    <input
                      value={m.value}
                      onChange={e=>{
                        const v = e.target.value
                        setMuestras(arr => arr.map((x,idx)=> idx===i ? {...x, value:v} : x))
                      }}
                      placeholder="Ej: 59.8"
                      style={{...inputStyle, padding:8, borderRadius:8}}
                    />
                  </td>
                  <td style={{padding:6}}>
                    <button
                      onClick={()=>delMuestra(i)}
                      disabled={muestras.length<=1}
                      style={ghostBtn}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addMuestra} style={{...ghostBtn, marginTop:8}}>Agregar muestra</button>
        </div>

        {/* Totales SCRAP */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:16}}>
          <div>
            <label>Total producido</label>
            <input type="number" value={totalProducido} onChange={e=>setTotalProducido(e.target.value)}
                   placeholder="p.ej. 1200"
                   style={inputStyle}/>
          </div>
          <div>
            <label>Total defectuoso</label>
            <input type="number" value={totalDefectuoso} onChange={e=>setTotalDefectuoso(e.target.value)}
                   placeholder="p.ej. 12"
                   style={inputStyle}/>
          </div>
        </div>

        {/* Defectos por tipo (Pareto) */}
        <div style={{marginTop:16}}>
          <h4 style={{margin:'8px 0'}}>Defectos por tipo</h4>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th style={{textAlign:'left', padding:6, borderBottom:'1px solid rgba(0,0,0,.12)'}}>id_defecto_tipo</th>
                <th style={{textAlign:'left', padding:6, borderBottom:'1px solid rgba(0,0,0,.12)'}}>cantidad</th>
                <th style={{textAlign:'left', padding:6, borderBottom:'1px solid rgba(0,0,0,.12)'}}></th>
              </tr>
            </thead>
            <tbody>
              {defectos.map((d,i)=>(
                <tr key={i}>
                  <td style={{padding:6}}>
                    <input
                      value={d.id_defecto_tipo}
                      onChange={e=>{
                        const v = e.target.value
                        setDefectos(arr => arr.map((x,idx)=> idx===i ? {...x, id_defecto_tipo:v} : x))
                      }}
                      placeholder="Ej: 3"
                      style={{...inputStyle, padding:8, borderRadius:8}}
                    />
                  </td>
                  <td style={{padding:6}}>
                    <input
                      value={d.cantidad}
                      onChange={e=>{
                        const v = e.target.value
                        setDefectos(arr => arr.map((x,idx)=> idx===i ? {...x, cantidad:v} : x))
                      }}
                      placeholder="Ej: 5"
                      style={{...inputStyle, padding:8, borderRadius:8}}
                    />
                  </td>
                  <td style={{padding:6}}>
                    <button
                      onClick={()=>delDefecto(i)}
                      disabled={defectos.length<=1}
                      style={ghostBtn}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addDefecto} style={{...ghostBtn, marginTop:8}}>Agregar defecto</button>
        </div>

        {err && <div style={{marginTop:12, color:'crimson'}}>{err}</div>}
        {msg && <div style={{marginTop:12, color:'#22c55e'}}>{msg}</div>}

        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:16}}>
          <button onClick={onClose} style={{...ghostBtn, padding:'8px 14px'}}>Cancelar</button>
          <button onClick={submit} disabled={!canSave} className="btn primary">
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
