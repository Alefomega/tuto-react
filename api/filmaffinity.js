// api/filmaffinity.js
export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Falta el parámetro url' });
    }

    // Validar que sea una URL de filmaffinity
    if (!url.includes('filmaffinity.com')) {
        return res.status(400).json({ error: 'La URL debe ser de filmaffinity.com' });
    }

    try {
        const response = await fetch(url, {
            headers: {
                // Nos hacemos pasar por un browser para evitar bloqueos
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Filmaffinity respondió con error ${response.status}` });
        }

        const html = await response.text();

        // Extraer datos con regex sobre el HTML
        const titulo = extraer(html, /<h1[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/h1>/s)
                    || extraer(html, /<span[^>]*itemprop="name"[^>]*>(.*?)<\/span>/s);

        const anio = extraer(html, /<dd[^>]*itemprop="datePublished"[^>]*>(.*?)<\/dd>/s)
                  || extraer(html, /itemprop="datePublished"[^>]*>([\d]{4})</s);

        const sinopsis = extraer(html, /<dd[^>]*itemprop="description"[^>]*>(.*?)<\/dd>/s)
                      || extraer(html, /<p[^>]*class="[^"]*description[^"]*"[^>]*>(.*?)<\/p>/s);

        const director = extraer(html, /<dd[^>]*itemprop="director"[^>]*>.*?<span[^>]*itemprop="name"[^>]*>(.*?)<\/span>/s);

        const duracion = extraer(html, /<dd[^>]*itemprop="duration"[^>]*>(.*?)<\/dd>/s);

        const nota = extraer(html, /<div[^>]*id="movie-rat-avg"[^>]*>(.*?)<\/div>/s);

        return res.status(200).json({
            titulo: limpiar(titulo),
            anio: limpiar(anio),
            sinopsis: limpiar(sinopsis),
            director: limpiar(director),
            duracion: limpiar(duracion),
            nota: limpiar(nota),
        });

    } catch (error) {
        return res.status(500).json({ error: 'Error al hacer fetch a filmaffinity', detalle: error.message });
    }
}

function extraer(html, regex) {
    const match = html.match(regex);
    return match ? match[1] : null;
}

function limpiar(texto) {
    if (!texto) return null;
    // Eliminar tags HTML y espacios extra
    return texto.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}