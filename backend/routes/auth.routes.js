import { Router } from "express";
import {
  registerUser,
  loginUser
} from "../controllers/auth.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", registerUser);

authRouter.post("/login", loginUser);

authRouter.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    message: "AUTH_SUCCESS",
    user: req.user
  });
});

export default authRouter;
