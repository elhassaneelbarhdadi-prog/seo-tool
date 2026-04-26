import { API, request } from "./api";

export const askSEO = (data) =>
    request(API.chatAsk, {
        method: "POST",
        body: JSON.stringify(data)
    });