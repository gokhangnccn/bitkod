import SockJS from 'sockjs-client';
import { Client, over } from 'stompjs';

export class WebSocketService {
    private static instance: WebSocketService;
    private stompClient: Client | null = null;
    private subscriptions: { [key: string]: () => void } = {};

    private constructor() {}

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public connect(onConnect?: () => void, onError?: (error: any) => void): void {
        const token = localStorage.getItem('token');
        const socket = new SockJS(`/ws?token=${token}`);
        this.stompClient = over(socket);
        this.stompClient.debug = () => {};

        this.stompClient.connect(
            {},
            () => {
                console.log('WebSocket connected');
                onConnect?.();
            },
            (error) => {
                console.error('WebSocket connection error:', error);
                onError?.(error);
            }
        );
    }

    public subscribe(destination: string, callback: (message: any) => void): () => void {
        if (!this.stompClient) {
            throw new Error('WebSocket not connected');
        }

        const subscription = this.stompClient.subscribe(destination, (message) => {
            try {
                const payload = JSON.parse(message.body);
                callback(payload);
            } catch (error) {
                callback(message.body);
            }
        });

        this.subscriptions[destination] = () => subscription.unsubscribe();
        return () => this.unsubscribe(destination);
    }

    public unsubscribe(destination: string): void {
        const unsubscribe = this.subscriptions[destination];
        if (unsubscribe) {
            unsubscribe();
            delete this.subscriptions[destination];
        }
    }

    public disconnect(): void {
        if (this.stompClient) {
            Object.keys(this.subscriptions).forEach(this.unsubscribe.bind(this));
            this.stompClient.disconnect();
            this.stompClient = null;
        }
    }
}

export const websocketService = WebSocketService.getInstance();
export default websocketService;