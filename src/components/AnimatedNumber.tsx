/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

export default function AnimatedNumber({ value, precision = 0, suffix = "" }: { value: number, precision?: number, suffix?: string }) {
    const spring = useSpring(value, { stiffness: 100, damping: 30 });
    const display = useTransform(spring, (latest) => latest.toFixed(precision) + suffix);

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{display}</motion.span>;
}
