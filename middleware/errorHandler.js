import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {

    let status = 500;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "Une erreur interne est survenue.";

    if (err instanceof ApiError) {
        status = err.statusCode;
        code = err.code;
        message = err.message;
    }

    logger.error({
        method: req.method,
        url: req.originalUrl,
        status,
        code,
        message,
        stack: process.env.DEBUG === "true"
            ? err.stack
            : undefined
    });

    return res.status(status).json({
        success: false,
        error: {
            code,
            message
        }
    });

};

export default errorHandler;