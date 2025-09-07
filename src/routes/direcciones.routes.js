import { Router } from "express";
import { getDirecciones, postDirecciones, updateDirecciones, deleteDirecciones } from "../controllers/direcciones.controller.js";


const router = Router();

router.get('/direcciones', getDirecciones);

router.post('/direcciones', postDirecciones);

router.put('/direcciones', updateDirecciones);

router.delete('/direcciones', deleteDirecciones);



export default router;