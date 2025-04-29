import { useEffect } from 'react';
import { websocketService } from '../api/websocket';

export function useWebSocket(userId: number | string | null, onMessage: (data: any) => void) {
    useEffect(() => {
        if (!userId) return;

        websocketService.connect(() => {
            websocketService.subscribe(`/user/${userId}/topic/feedback`, onMessage);
        });

        return () => {
            websocketService.disconnect();
        };
    }, [userId, onMessage]);
}

