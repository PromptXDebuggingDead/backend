import express from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { sendMessage, allMessages } from '../controllers/messageController.js';

const router = express.Router();

router.route('/').post(verifyJWT, sendMessage);
router.route('/:chatId/').get(verifyJWT, allMessages);

export default router;

