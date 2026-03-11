import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';

interface AdBannerProps {
    className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ className = "" }) => {
    const { state } = useGame();
    const adId = state.bannerAdUnitId;

    useEffect(() => {
        if (adId && (window as any).adsbygoogle) {
            try {
                ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            } catch (e) {
                console.error("AdSense Banner Error:", e);
            }
        }
    }, [adId]);

    if (!adId) return null;

    return (
        <div className={`ad-banner-container overflow-hidden rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center min-h-[90px] ${className}`}>
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-6329108306834809"
                 data-ad-slot={adId}
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        </div>
    );
};

export default AdBanner;
