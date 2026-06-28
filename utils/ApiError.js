class ApiError extends Error {

    constructor(statusCode, message, code = null) {

        super(message);

        this.name = "ApiError";
        this.statusCode = statusCode;
        this.code = code || "API_ERROR";

        Error.captureStackTrace?.(this, this.constructor);
    }

}

export default ApiError;