import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import API from '../api.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Legend, Tooltip, Filler, annotationPlugin)

export default function ControlChart({ dim, uiMode, refresh, from, to, bump }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const f = async () => {
      try {
        const url =
          `/charts/xbar-r/?dimension=${dim}` +
          `&group_size=5` +
          `&mode=${uiMode || 'demo'}` +
          (from ? `&from=${from}` : '') +
          (to   ? `&to=${to}`   : '')
        const r = await API.get(url)
        setData(r.data)
      } catch (e) { console.error(e) }
    }
    f()
  }, [dim, uiMode, refresh, from, to, bump])


  if(!data || !data.xbar?.length) return <div>Cargando…</div>

  const labels = data.xbar.map((_,i)=> `G${i+1}`)
  const chartData = {
    labels,
    datasets:[
      {
        label:'X̄',
        data: data.xbar,
        borderColor: '#1d4ed8', // azul primario para tema claro
        backgroundColor: (ctx)=>{
          const g = ctx.chart.ctx.createLinearGradient(0,0,0,240)
          g.addColorStop(0, 'rgba(29,78,216,.18)')
          g.addColorStop(1, 'rgba(29,78,216,0)')
          return g
        },
        tension: .25,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#1d4ed8',
        pointBorderColor: '#1d4ed8',
        fill: true,
        borderWidth: 2
      }
    ]
  }

  const options = {
    responsive:true,
    maintainAspectRatio:false,
    interaction:{ mode:'nearest', intersect:false },
    plugins:{
      legend:{ position:'top', labels:{ color:'#0f172a' } },
      tooltip:{ enabled:true, titleColor:'#0f172a', bodyColor:'#0f172a' },
      annotation:{
        annotations:{
          ucl:{ type:'line', yMin:data.ucl_x, yMax:data.ucl_x, borderColor:'var(--danger)', borderDash:[6,6], borderWidth:2,
            label:{ display:true, content:'UCL', position:'start', color:'#fff', backgroundColor:'var(--danger)' } },
          cl :{ type:'line', yMin:data.xbarbar, yMax:data.xbarbar, borderColor:'#64748b', borderDash:[4,4], borderWidth:1.5,
            label:{ display:true, content:'CL', position:'start', color:'#111827', backgroundColor:'#e5e7eb' } },
          lcl:{ type:'line', yMin:data.lcl_x, yMax:data.lcl_x, borderColor:'var(--danger)', borderDash:[6,6], borderWidth:2,
            label:{ display:true, content:'LCL', position:'start', color:'#fff', backgroundColor:'var(--danger)' } }
        }
      }
    },
    scales:{
      x:{ ticks:{ color:'#475569' }, grid:{ color:'var(--grid)' } },
      y:{ ticks:{ color:'#475569' }, grid:{ color:'var(--grid)' } }
    }
  }

  return <div style={{height:360}} className="card"><Line data={chartData} options={options} /></div>
}
