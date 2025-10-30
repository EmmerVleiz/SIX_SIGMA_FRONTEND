import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import API from '../api.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  annotationPlugin
)

export default function ScrapTrend({ from = '', to = '', opp = 1 }) {
  const [payload, setPayload] = useState(null)

  useEffect(() => {
    API.get(`/yield/trend/?from=${from}&to=${to}&opp=${opp}`)
      .then((r) => setPayload(r.data))
      .catch(console.error)
  }, [from, to, opp])

  if (!payload) return <div>Cargando…</div>
  const labels = (payload.trend || []).map((r) => r.fecha)
  const yieldPerc = (payload.trend || []).map((r) => r.yield_perc)
  const sigma = (payload.trend || []).map((r) => r.sigma)

  const data = {
    labels,
    datasets: [
      {
        label: 'Yield (%)',
        data: yieldPerc,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,.15)',
        tension: 0.25,
        pointRadius: 3,
        yAxisID: 'y',
      },
      {
        label: 'Sigma (aprox)',
        data: sigma,
        borderColor: '#0ea5e9',               // celeste para diferenciar de X̄
        backgroundColor: 'rgba(14,165,233,.15)',
        tension: 0.25,
        pointRadius: 3,
        yAxisID: 'y1',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#0f172a' } },
      tooltip: { titleColor:'#0f172a', bodyColor:'#0f172a' }
    },
    scales: {
      x: { ticks: { color: '#475569' }, grid: { color: 'var(--grid)' } },
      y: {
        position: 'left',
        min: 0,
        max: 100,
        ticks: { color: '#475569', callback: (v) => `${v}%` },
        grid: { color: 'var(--grid)' },
      },
      y1: {
        position: 'right',
        min: 0,
        max: 6,
        ticks: { color: '#475569' },
        grid: { drawOnChartArea: false },
      },
    },
  }

  return (
    <div style={{ height: 300 }} className="card">
      <Line data={data} options={options} />
    </div>
  )
}
