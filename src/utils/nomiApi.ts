import axios from "axios";

const nomiUrl = new URL("https://beta.nomi.ai/api");

export const api = axios.create({
    baseURL: nomiUrl.toString(),
    timeout: 1000,
    headers: { "Content-Type": "application/json" },
});
