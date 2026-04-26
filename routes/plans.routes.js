import express from "express";
import { PLANS } from "../config/plans.js";

const router = express.Router();

/* ========================= */
/* GET PLANS */
/* ========================= */

router.get("/", (req, res) => {
    res.json(PLANS);
});

export default router;