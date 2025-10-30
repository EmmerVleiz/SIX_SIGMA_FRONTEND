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
import API from '../api.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip
)

export default function CapabilityTrend({ producto = '1', linea = '1', from = '', to = '' }) {
  const [series, setSeries] = useState(null)

  useEffect(() => {
    const q = `?producto=${producto}&linea=${linea}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`
    API.get(`/indicators/trend/${q}`)
      .then((r) => setSeries(r.data))
      .catch(console.error)
  }, [producto, linea, from, to])

  if (!series) return <div>Cargando…</div>

  const data = {
    labels: series.labels,
    datasets: [
      {
        label: 'Cp',
        data: series.cp,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,.15)',
        tension: 0.25,
        pointRadius: 3,
      },
      {
        label: 'Cpk',
        data: series.cpk,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,.15)',
        tension: 0.25,
        pointRadius: 3,
      },
      {
        label: 'Sigma',
        data: series.sigma,
        borderColor: '#0ea5e9',
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
    plugins: { legend: { labels: { color: '#0f172a' } }, tooltip:{ titleColor:'#0f172a', bodyColor:'#0f172a' } },
    scales: {
      x: { ticks: { color: '#475569' }, grid: { color: 'var(--grid)' } },
      y: { position: 'left', ticks: { color: '#475569' }, grid: { color: 'var(--grid)' } },
      y1: { position: 'right', min: 0, max: 6, ticks: { color: '#475569' }, grid: { drawOnChartArea: false } },
    },
  }

  return (
    <div style={{ height: 300 }} className="card">
      <Line data={data} options={options} />
    </div>
  )
}
