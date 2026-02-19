import { useState } from 'react';

export default function SearchBox() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [htmlCrudo, setHtmlCrudo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function handleBuscar() {
    if (!busqueda.trim()) return;
    setCargando(true);
    setError(null);
    setResultados([]);
    setHtmlCrudo('');

    try {
      const res = await fetch(`/api/filmaffinity-search?stext=${encodeURIComponent(busqueda)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
      } else {
        setResultados(data.resultados || []);
        setHtmlCrudo(data.htmlCrudo || '');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h1>Filmaffinity Búsqueda</h1>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Busca una película o serie..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleBuscar(); }}
          style={{ width: 320, padding: 8 }}
        />
        <button onClick={handleBuscar} style={{ marginLeft: 10, padding: '8px 16px' }}>
          Buscar
        </button>
      </div>

      {cargando && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {resultados.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #ccc' }}>
          <h2>Resultados</h2>
          {resultados.map((r, i) => (
            <div key={i} style={{ marginBottom: 12, padding: 8, background: '#f5f5f5' }}>
              <strong>{i + 1}. {r.titulo}</strong>
              {r.ano && <div>Año: {r.ano}</div>}
              {r.nota && <div>Nota: {r.nota}</div>}
              {r.url && <div><a href={r.url} target="_blank" rel="noreferrer">Ver en FilmAffinity</a></div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <details>
          <summary>🔍 Debug: HTML crudo (expandir)</summary>
          <pre style={{ maxHeight: 300, overflow: 'auto', background: '#fff', padding: 8 }}>
            {htmlCrudo ? htmlCrudo.slice(0, 20000) : 'Sin HTML crudo disponible'}
          </pre>
        </details>
      </div>
    </div>
  );
}