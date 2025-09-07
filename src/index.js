import express from 'express';
import cors from 'cors';
import "dotenv/config";
import geocodeRouter from "./routes/geocode.routes.js";
import direccionesRoutes from './routes/direcciones.routes.js';
import indexRoutes from './routes/index.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// ✅ Prefijo consistente
app.use("/api", indexRoutes);
app.use("/api", direccionesRoutes);
app.use("/api", geocodeRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
