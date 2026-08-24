import { Router, Request, Response } from 'express';

const router = Router();

router.post('/simple-login', async (req: Request, res: Response) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'Admin password not set' });
  }

  if (password === adminPassword) {
    return res.json({ success: true });
  }

  return res.status(401).json({ error: 'Wrong password' });
});

export default router;
