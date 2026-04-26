import { API, request } from "./api";

export const getNichesAI = async (keyword) => {
    return await request(API.nicheGenerate, {
        method: "POST",
        body: JSON.stringify({ keyword })
    });
};