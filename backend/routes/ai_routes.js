import { Router } from 'express';
import {openai_call} from '../controllers/ai_controllers.js'


const router = Router();

router.post('/openai', openai_call);

export default router;
