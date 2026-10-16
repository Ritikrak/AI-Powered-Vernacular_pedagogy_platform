import express from 'express';
import { languageController } from '../controllers/language.controller.js';

const router = express.Router();

router.get('/', languageController.getLanguages);

export default router;
