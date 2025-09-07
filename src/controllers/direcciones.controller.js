import { pool } from "../db.js";
  



export const getDirecciones = async (req, res) => { 
    const [rows] = await pool.query('SELECT * FROM direcciones')
    res.json(rows)
}

export const postDirecciones = async (req, res) => {
  const { pais, provincia, ciudad, calle, numero, calle_referencia_1, calle_referencia_2 } = req.body;

  try {
    const [rows] = await pool.query(
      `INSERT INTO direcciones 
      (pais, provincia, ciudad, calle, numero, calle_referencia_1, calle_referencia_2) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pais, provincia, ciudad, calle, numero, calle_referencia_1, calle_referencia_2]
    );

    res.json({
      id: rows.insertId,
      pais, provincia, ciudad, calle, numero, calle_referencia_1, calle_referencia_2
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const updateDirecciones = (req, res) => { res.send('Actualizar una dirección')}

export const deleteDirecciones = (req, res) => { res.send('Eliminar una dirección')}