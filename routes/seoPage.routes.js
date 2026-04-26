import express from "express";
import { getSeoPage } from "../controllers/seoPage.controller.js";

const router = express.Router();

router.get("/", getSeoPage);

export default router;