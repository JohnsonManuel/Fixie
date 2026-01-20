import { useCallback } from "react";
import { useAuth } from "./useAuth";
import { config } from "../services/config";

const RAW_API_URL = config.functions.main_endpoint || "";
const API_BASE_URL = RAW_API_URL.endsWith("/") 
    ? RAW_API_URL.slice(0, -1) 
    : RAW_API_URL;

export const useApi = () => {
    const { user } = useAuth();

    const fetchWithAuth = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        if (!user) throw new Error("User not authenticated");
        
        const token = await user.getIdToken();
        
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {}),
        };

        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            let err = res.statusText;
            try {
                const jsonError = await res.json();
                err = jsonError.detail || JSON.stringify(jsonError);
            } catch {
                err = await res.text();
            }
            throw new Error(err || res.statusText);
        }
        return res;
    }, [user]);

    return { fetchWithAuth };
};