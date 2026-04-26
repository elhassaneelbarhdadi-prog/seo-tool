
import express from "express";

import { auth } from "../middleware/auth.middleware.js";

import {
    getProductsSeo
} from "../controllers/productSeo.controller.js";

const router = express.Router();

/* PRODUCT SEO */

router.get("/products", auth, getProductsSeo);

export default router;