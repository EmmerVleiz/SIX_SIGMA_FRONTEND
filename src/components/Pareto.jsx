import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Legend, Tooltip
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import API from '../api.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Legend, Tooltip, annotationPlugin)

export default function Pareto({ uiMode, refresh, from, to, bump }){
  // null = aún cargando; [] = cargado sin datos; [..] = con datos
  const [series, setSeries] = useState(null)

  useEffect(() => {
    const params = {}
    if (from) params.from = from
    if (to)   params.to   = to

    API.get('/charts/pareto/', { params })
      .then(r => setSeries(Array.isArray(r.data?.series) ? r.data.series : []))
      .catch(console.error)
  }, [uiMode, refresh, from, to, bump])

  if (series === null) return <div>Cargando…</div>

  // Si no hay datos en el rango, mostramos una barra 0 y acumulado 0%
  const safeSeries = (series.length > 0) ? series : [{ category: 'Sin datos', count: 0, cum_perc: 0 }]

  const labels = safeSeries.map(s=>s.category)
  const counts = safeSeries.map(s=>s.count)
  const cum    = safeSeries.map(s=>s.cum_perc)

  const dataBar = {
    labels,
    datasets: [
      {
        type:'bar',
        label:'Defectos',
        data: counts,
        yAxisID:'y',
        borderWidth:1,
        borderColor:'#10b981',
        backgroundColor:'rgba(16,185,129,.20)',
        borderRadius: 6,
        barThickness: 26
      },
      {
        type:'line',
        label:'Acumulado %',
        data: cum,
        yAxisID:'y1',
        borderColor:'#f59e0b',
        backgroundColor:'rgba(245,158,11,.12)',
        pointBackgroundColor:'#f59e0b',
        tension:.25,
        pointRadius:3,
        borderWidth:2
      }
    ]
  }

  const options = {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{
      legend:{ labels:{ color:'#0f172a' } },
      tooltip:{ titleColor:'#0f172a', bodyColor:'#0f172a' },
      annotation:{
        annotations:{
          p80:{ type:'line', scaleID:'y1', value:80, borderColor:'var(--warn)', borderDash:[6,4], borderWidth:2,
            label:{ display:true, content:'80%', position:'start', backgroundColor:'var(--warn)', color:'#111827' }
          }
        }
      }
    },
    scales:{
      x:{ ticks:{ color:'#475569' }, grid:{ color:'var(--grid)' } },
      y:{ position:'left', ticks:{ color:'#475569' }, grid:{ color:'var(--grid)' }, beginAtZero:true },
      y1:{ position:'right', min:0, max:100, ticks:{ color:'#475569', callback:(v)=>`${v}%` }, grid:{ drawOnChartArea:false } }
    }
  }

  return <div style={{height:300}} className="card"><Bar data={dataBar} options={options} /></div>
}
