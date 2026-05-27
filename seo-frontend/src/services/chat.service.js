import { API, request } from "./api";

export const askSEO = async (data) => {

    if (!data?.message) {
        throw new Error("Message requis");
    }

    return request(API.chatSEO, {
        method: "POST",
        body: JSON.stringify({
            message: data.message.trim(),
            context: data.context || []
        })
    });
};