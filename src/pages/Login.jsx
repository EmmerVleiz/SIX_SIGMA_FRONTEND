
import React, { useState } from 'react'
import { login } from '../api.js'  // <= named import

export default function LoginPage() {
  const [username, setU] = useState('')
  const [password, setP] = useState('')
  const [err, setErr] = useState(null)
  

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr(null)
    try {
      await login(username, password)
      window.location.href = '/'
    } catch {
      setErr('Credenciales inválidas')
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '10vh auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginTop: 12 }}>
          <label>Usuario</label>
          <input value={username} onChange={e=>setU(e.target.value)} style={{ width:'100%' }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e=>setP(e.target.value)} style={{ width:'100%' }} />
        </div>
        {err && <p style={{ color:'crimson' }}>{err}</p>}
        <button type="submit" style={{ marginTop: 16 }}>Entrar</button>
      </form>
    </div>
  );
}
