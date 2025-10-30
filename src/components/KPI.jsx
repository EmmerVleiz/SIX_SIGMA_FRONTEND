import React from 'react'

/**
 * Colorea Cp/Cpk:
 *   >=1.67  → ok (verde)
 *   1.33-1.67 → warn (ámbar)
 *   <1.33   → bad (rojo)
 * Otros KPIs quedan neutros.
 */
export default function KPI({label, value}) {
  const v = Number(value)
  let cls = 'kpi'
  if (label === 'Cp' || label === 'Cpk') {
    if (!isNaN(v)) {
      if (v >= 1.67) cls += ' ok'
      else if (v >= 1.33) cls += ' warn'
      else cls += ' bad'
    }
  }
  return (
    <div className={`card ${cls}`}>
      <div className="label">{label}</div>
      <div className="value">{(value ?? '—')}</div>
    </div>
  )
}
