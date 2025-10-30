import React, { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Legend, Tooltip } from 'chart.js'
import API from '../api.js'
ChartJS.register(CategoryScale, LinearScale, BarElement, Legend, Tooltip)

export default function Histogram({ dim, uiMode, refresh, from, to, bump }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    const url =
      `/charts/histogram/?dimension=${dim}` +
      `&bins=12` +
      `&mode=${uiMode || 'demo'}` +
      (from ? `&from=${from}` : '') +
      (to   ? `&to=${to}`   : '')
    API.get(url)
      .then(r => setData(r.data))
      .catch(console.error)
  }, [dim, uiMode, refresh, from, to, bump])

  if(!data) return <div>Cargando…</div>

  const chartData = {
    labels: data.centers.map(c=> Number(c).toFixed(3)),
    datasets: [{
      label:'Frecuencia',
      data: data.counts,
      borderWidth:1,
      borderColor: '#1d4ed8',
      backgroundColor: (ctx)=>{
        const g = ctx.chart.ctx.createLinearGradient(0,0,0,220)
        g.addColorStop(0, 'rgba(29,78,216,.22)')
        g.addColorStop(1, 'rgba(29,78,216,.08)')
        return g
      },
      borderRadius: 6,
      barThickness: 24
    }]
  }

  const options = {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{ legend:{ labels:{ color:'#0f172a' } }, tooltip:{ titleColor:'#0f172a', bodyColor:'#0f172a' } },
    scales:{
      x:{ ticks:{ color:'#475569', maxRotation:0 }, grid:{ color:'var(--grid)' } },
      y:{ ticks:{ color:'#475569' }, grid:{ color:'var(--grid)' }, beginAtZero:true }
    }
  }

  return <div style={{height:360}} className="card"><Bar data={chartData} options={options} /></div>
}
