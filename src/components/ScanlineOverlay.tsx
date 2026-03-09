/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function ScanlineOverlay() {
    return (
        <div className="fixed inset-0 z-[999] pointer-events-none overflow-hidden select-none">
            {/* Moving Scanline */}
            <div className="absolute inset-0 w-full h-[100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-20" />

            {/* Flicker Effect */}
            <div className="absolute inset-0 w-full h-full bg-white opacity-[0.015] animate-[flicker_0.15s_infinite]" />

            <style>{`
        @keyframes flicker {
          0% { opacity: 0.0151; }
          10% { opacity: 0.018; }
          20% { opacity: 0.015; }
          30% { opacity: 0.016; }
          40% { opacity: 0.013; }
          50% { opacity: 0.015; }
          60% { opacity: 0.018; }
          70% { opacity: 0.015; }
          80% { opacity: 0.013; }
          90% { opacity: 0.016; }
          100% { opacity: 0.015; }
        }
      `}</style>
        </div>
    );
}
