/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useGame } from '../context/GameContext';

const OFFLINE_KEY = 'ct_last_session_exit';

export default function OfflineEarningsHandler() {
    const { dispatch } = useGame();

    useEffect(() => {
        // 1. Calculate offline earnings on mount
        const lastExit = localStorage.getItem(OFFLINE_KEY);
        if (lastExit) {
            const exitTime = parseInt(lastExit, 10);
            const now = Date.now();
            const secondsAway = Math.floor((now - exitTime) / 1000);

            // Only trigger if away for more than 5 minutes (300s)
            if (secondsAway > 300) {
                dispatch({ type: 'CALC_OFFLINE_EARNINGS', secondsAway });
            }
        }

        // 2. Set up exit listener
        const handleExit = () => {
            localStorage.setItem(OFFLINE_KEY, Date.now().toString());
        };

        window.addEventListener('beforeunload', handleExit);
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                handleExit();
            }
        });

        return () => {
            window.removeEventListener('beforeunload', handleExit);
        };
    }, [dispatch]);

    return null;
}
