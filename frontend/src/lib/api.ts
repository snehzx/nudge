import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true,
});

//attach the token to every outgoing request
//this fxn axios runs on every req before sending it -like a middleware for client side
api.interceptors.request.use((config) => {
  //config is the req about to go out -url , method , headers ,body
  const token = useAuthStore.getState().token; // read from the store
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

//on 401 , refresh once and retry
let refreshing: Promise<string> | null = null;

//this part takes two fxns -one for success and one for error , succes one returns the res unchanged
api.interceptors.response.use(
  (res) => res, //if success pass through untouched
  async (error) => {
    // failure-this runs
    const original = error.config;
    if (error.response?.status !== 401 || original._retired) {
      return Promise.reject(error);
    }
    original._retired = true;
    refreshing ??= api // assign only if currently null or undef
      .post("/auth/refresh")
      .then((r) => {
        const t = r.data.data.accessToken; //r.data-axios parsed res body , data-api envelope
        useAuthStore.getState().setToken(t); //write to the store
        return t;
      })
      .finally(() => (refreshing = null));

    try {
      await refreshing;
      return api(original); //retry the original request
    } catch (error) {
      useAuthStore.getState().clear();
      return Promise.reject(error);
    }
  },
);

import { useAuthStore } from "../store/authStore.ts";
