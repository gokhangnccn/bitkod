import axios, { AxiosError, AxiosInstance } from 'axios';

class ApiClient {
    private static instance: ApiClient;
    private api: AxiosInstance;

    private constructor() {
        this.api = axios.create({
            baseURL:
             //'http://localhost:8040/api',
            'https://api.bitkod.org/api',
            withCredentials: true,
        });

        this.setupInterceptors();
    }

    public static getInstance(): ApiClient {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }
        return ApiClient.instance;
    }

    private setupInterceptors(): void {
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        this.api.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    public getAxiosInstance(): AxiosInstance {
        return this.api;
    }
}

export const api = ApiClient.getInstance().getAxiosInstance();