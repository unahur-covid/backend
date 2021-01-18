import express from 'express';
import { withErrorHandling } from './utils';
import { index, registro, login } from '../controllers/usuario_controller';

require('../middlewares/auth');

const router = express.Router();

router.get('/', withErrorHandling(index));
router.post('/registro', withErrorHandling(registro));
router.post('/login', withErrorHandling(login));

export default router;
