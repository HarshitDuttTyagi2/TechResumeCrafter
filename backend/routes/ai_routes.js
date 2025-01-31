import { Router } from 'express';
import {openai_call} from '../controllers/ai_controllers.js'
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";


const router = Router();

// router.post('/openai', ClerkExpressRequireAuth(), openai_call);
router.post('/openai', ClerkExpressRequireAuth(), openai_call);

export default router;
