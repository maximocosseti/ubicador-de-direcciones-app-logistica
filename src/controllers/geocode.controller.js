import axios from "axios";

//Geocoding simple (ya lo tenías)
export const geocode = async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: "q (query) required" });

  try {
    const url = "https://nominatim.openstreetmap.org/search";
    const resp = await axios.get(url, {
      params: {
        q,
        format: "json",
        limit: 1,
        addressdetails: 1
      },
      headers: { "User-Agent": "TuProyectoPortafolio/1.0" }
    });

    if (!resp.data || resp.data.length === 0) {
      return res.status(404).json({ error: "no_results" });
    }

    const item = resp.data[0];
    return res.json({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: item.display_name
    });
  } catch (err) {
    console.error("Geocode error:", err.message);
    return res.status(500).json({ error: "geocoding_failed" });
  }
};

//Calcular punto medio con 3 calles
export const calcularPuntoMedio = async (req, res) => {

  const { calles } = req.body;

  if (!calles || calles.length !== 3) {
    return res.status(400).json({ error: "Se requieren 3 calles" });
  }

  try {
    // Obtener nodos de una calle: primero Nominatim, luego Overpass
    const obtenerNodos = async (calle) => {
      // 1. Buscar en Nominatim
      const q = `${calle.calle}, ${calle.ciudad}, ${calle.partido ?? ''}, ${calle.provincia}, ${calle.pais}, `;

      const nomResp = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
          q,
          format: "json",
          limit: 1,
          polygon_geojson: 0
        },
        headers: { "User-Agent": "TuProyectoPortafolio/1.0" }
      });

      if (!nomResp.data || !nomResp.data.length) {
        console.log("Nominatim no encontró:", q);
        return [];
      }

      const item = nomResp.data[0];
      console.log("que es item:", item.display_name);
      const osmType = item.osm_type; // "way", "node" o "relation"
      console.log("que es osmType:", osmType);
      const osmId = item.osm_id;
      console.log("que es osmId:", osmId);

      let nodes = [];

      // 2. Si es un way/relation → pedimos a Overpass
      if (osmType === "way" || osmType === "relation") {
        const overpassId = osmType === "way" ? osmId : osmId + 3600000000; // ajuste para relation
        const overpassQuery = `
          [out:json];
          ${osmType}(${overpassId});
          out geom;
        `;

        const ovResp = await axios.get("https://overpass-api.de/api/interpreter", {
          params: { data: overpassQuery }
        });


        ovResp.data.elements.forEach((el) => {
          if (el.geometry) nodes.push(...el.geometry);
        });
      }

      // 3. Si no hay nodos, usar fallback al punto de Nominatim
      if (!nodes.length) {
        console.log("Usando fallback de Nominatim para porque no hay nodos:", q);
        nodes.push({ lat: parseFloat(item.lat), lon: parseFloat(item.lon) });
      }

      // Reducir cantidad de nodos
      if (nodes.length > 5) nodes = nodes.filter((_, i) => i % 5 === 0);

      return nodes;
    };

    // Obtener nodos para cada calle
    const nodos = await Promise.all(calles.map(obtenerNodos));

    console.log("Nodos calle 1:", nodos[0].length);
    console.log("Nodos calle 2:", nodos[1].length);
    console.log("Nodos calle 3:", nodos[2].length);

    // Calcular distancias
    const filtrarNodos = (principal, ref1, ref2, umbral = 200) => {
      return principal.filter((p) => {
        const d1 = Math.min(...ref1.map((r) => distancia(p.lat, p.lon, r.lat, r.lon)));
        const d2 = Math.min(...ref2.map((r) => distancia(p.lat, p.lon, r.lat, r.lon)));
        return d1 <= umbral && d2 <= umbral;
      });
    };

    const nodosFiltrados = filtrarNodos(nodos[0], nodos[1], nodos[2], 2000);
    if (!nodosFiltrados.length) {
      return res.status(404).json({ error: "No se encontró punto intermedio" });
    }

    const lat = nodosFiltrados.reduce((acc, n) => acc + n.lat, 0) / nodosFiltrados.length;
    const lon = nodosFiltrados.reduce((acc, n) => acc + n.lon, 0) / nodosFiltrados.length;

    res.json({ lat, lon });
  } catch (err) {
    console.error("Midpoint error:", err.message);
    res.status(500).json({ error: "midpoint_failed" });
  }
};

//Función Haversine
function distancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
