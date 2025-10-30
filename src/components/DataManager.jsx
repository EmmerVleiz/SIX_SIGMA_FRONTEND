import React, { useEffect, useState } from 'react'
import API from '../api.js'

export default function DataManager({ open, onClose, onChanged, defaultFecha, defaultProducto, defaultLinea }) {
  const [fecha, setFecha] = useState(defaultFecha || new Date().toISOString().slice(0,10))
  const [producto, setProducto] = useState(String(defaultProducto || '1'))
  const [linea, setLinea] = useState(String(defaultLinea || '1'))

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [med, setMed] = useState([])
  const [sc, setSc] = useState([])
  const [de, setDe] = useState([])

  useEffect(()=>{ if(open){ fetchList() } }, [open])

  const fetchList = async () => {
    if(!open) return
    setLoading(true); setErr('')
    try{
      const r = await API.get(`/ingreso/produccion/list/?fecha=${fecha}&producto=${producto}&linea=${linea}`)
      setMed(r.data.medicion || [])
      setSc(r.data.scrap || [])
      setDe(r.data.defecto || [])
    } catch(e){
      console.error(e)
      setErr(e?.response?.data?.detail || String(e))
    } finally{
      setLoading(false)
    }
  }

  const saveMed = async (row) => {
    const payload = {
      t1: row.t1, t2: row.t2, t3: row.t3, t4: row.t4,
      promedio: row.promedio, th: row.th, codigo: row.codigo, orden: row.orden
    }
    await API.put(`/medicion/${row.id_medicion}/`, payload)
    onChanged && onChanged()
  }
  const delMed = async (row) => {
    await API.delete(`/medicion/${row.id_medicion}/`)
    setMed(med.filter(x=>x.id_medicion!==row.id_medicion))
    onChanged && onChanged()
  }

  const saveScrap = async (row) => {
    await API.put(`/scrap/${row.id_scrap}/`, {
      total_producido: row.total_producido,
      total_defectuoso: row.total_defectuoso
    })
    onChanged && onChanged()
  }
  const delScrap = async (row) => {
    await API.delete(`/scrap/${row.id_scrap}/`)
    setSc(sc.filter(x=>x.id_scrap!==row.id_scrap))
    onChanged && onChanged()
  }

  const saveDef = async (row) => {
    await API.put(`/defecto/${row.id_defecto}/`, {
      id_defecto_tipo: row.id_defecto_tipo,
      cantidad: row.cantidad,
      lote: row.lote,
      turno: row.turno
    })
    onChanged && onChanged()
  }
  const delDef = async (row) => {
    await API.delete(`/defecto/${row.id_defecto}/`)
    setDe(de.filter(x=>x.id_defecto!==row.id_defecto))
    onChanged && onChanged()
  }

  if(!open) return null

  /* === Estilos claros (solo colores) === */
  const card = {
    background:'#ffffff',
    border:'1px solid rgba(0,0,0,.12)',
    borderRadius:12,
    padding:12,
    marginTop:12
  }
  const input = {
    background:'#ffffff',
    border:'1px solid rgba(0,0,0,.12)',
    color:'var(--text)',
    borderRadius:8,
    padding:6
  }
  const labelMuted = { fontSize:12, color:'var(--muted)' }
  const thBorder = { textAlign:'left', padding:6, borderBottom:'1px solid rgba(0,0,0,.12)' }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,.35)', zIndex:9999,
      display:'flex', alignItems:'flex-start', justifyContent:'center', overflow:'auto'
    }}>
      <div style={{
        width:'95%', maxWidth:1200, margin:'32px 0',
        background:'#ffffff', border:'1px solid rgba(0,0,0,.12)',
        borderRadius:16, padding:16, color:'var(--text)',
        boxShadow:'0 20px 60px rgba(0,0,0,.18)'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{margin:0}}>Revisar / editar datos</h2>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>

        <div style={{display:'flex', gap:12, alignItems:'end', marginTop:8}}>
          <div>
            <label style={labelMuted}>Fecha</label><br/>
            <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={input}/>
          </div>
          <div>
            <label style={labelMuted}>Producto (id)</label><br/>
            <input type="number" value={producto} onChange={e=>setProducto(e.target.value)} style={{...input, width:120}}/>
          </div>
          <div>
            <label style={labelMuted}>Línea (id)</label><br/>
            <input type="number" value={linea} onChange={e=>setLinea(e.target.value)} style={{...input, width:120}}/>
          </div>
          <button className="btn primary" onClick={fetchList}>Buscar</button>
        </div>

        {loading && <div style={{marginTop:12}}>Cargando…</div>}
        {err && <div style={{marginTop:12, color:'#ef4444'}}>{err}</div>}

        {/* MEDICION */}
        <div style={card}>
          <h3 style={{marginTop:0}}>Medición</h3>
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Orden</th><th>Código</th>
                  <th>t1</th><th>t2</th><th>t3</th><th>t4</th>
                  <th>Promedio</th><th>th</th><th></th>
                </tr>
              </thead>
              <tbody>
                {med.map((r,idx)=>(
                  <tr key={r.id_medicion}>
                    <td>{r.id_medicion}</td>
                    <td><input style={{...input, width:70}} value={r.orden ?? ''} onChange={e=>setMed(med.map((x,i)=>i===idx?{...x,orden:e.target.value}:x))}/></td>
                    <td><input style={{...input, width:90}} value={r.codigo ?? ''} onChange={e=>setMed(med.map((x,i)=>i===idx?{...x,codigo:e.target.value}:x))}/></td>
                    {['t1','t2','t3','t4','promedio','th'].map(f=>(
                      <td key={f}><input style={{...input, width:90}} value={r[f] ?? ''} onChange={e=>setMed(med.map((x,i)=>i===idx?{...x,[f]:e.target.value}:x))}/></td>
                    ))}
                    <td style={{whiteSpace:'nowrap'}}>
                      <button className="btn" onClick={()=>saveMed(r)}>Guardar</button>{' '}
                      <button className="btn danger" onClick={()=>delMed(r)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                {!med.length && <tr><td colSpan={10} style={{color:'var(--muted)'}}>Sin filas</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* SCRAP */}
        <div style={card}>
          <h3 style={{marginTop:0}}>Scrap (totales)</h3>
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Total producido</th><th>Total defectuoso</th><th></th></tr>
              </thead>
              <tbody>
                {sc.map((r,idx)=>(
                  <tr key={r.id_scrap}>
                    <td>{r.id_scrap}</td>
                    <td><input style={{...input, width:140}} value={r.total_producido ?? ''} onChange={e=>setSc(sc.map((x,i)=>i===idx?{...x,total_producido:e.target.value}:x))}/></td>
                    <td><input style={{...input, width:140}} value={r.total_defectuoso ?? ''} onChange={e=>setSc(sc.map((x,i)=>i===idx?{...x,total_defectuoso:e.target.value}:x))}/></td>
                    <td>
                      <button className="btn" onClick={()=>saveScrap(r)}>Guardar</button>{' '}
                      <button className="btn danger" onClick={()=>delScrap(r)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                {!sc.length && <tr><td colSpan={4} style={{color:'var(--muted)'}}>Sin filas</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* DEFECTOS */}
        <div style={card}>
          <h3 style={{marginTop:0}}>Defectos</h3>
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                <tr><th>ID</th><th>id_defecto_tipo</th><th>cantidad</th><th>lote</th><th>turno</th><th></th></tr>
              </thead>
              <tbody>
                {de.map((r,idx)=>(
                  <tr key={r.id_defecto}>
                    <td>{r.id_defecto}</td>
                    <td><input style={{...input, width:140}} value={r.id_defecto_tipo ?? ''} onChange={e=>setDe(de.map((x,i)=>i===idx?{...x,id_defecto_tipo:e.target.value}:x))}/></td>
                    <td><input style={{...input, width:120}} value={r.cantidad ?? ''} onChange={e=>setDe(de.map((x,i)=>i===idx?{...x,cantidad:e.target.value}:x))}/></td>
                    <td><input style={{...input, width:120}} value={r.lote ?? ''} onChange={e=>setDe(de.map((x,i)=>i===idx?{...x,lote:e.target.value}:x))}/></td>
                    <td><input style={{...input, width:120}} value={r.turno ?? ''} onChange={e=>setDe(de.map((x,i)=>i===idx?{...x,turno:e.target.value}:x))}/></td>
                    <td>
                      <button className="btn" onClick={()=>saveDef(r)}>Guardar</button>{' '}
                      <button className="btn danger" onClick={()=>delDef(r)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                {!de.length && <tr><td colSpan={6} style={{color:'var(--muted)'}}>Sin filas</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
