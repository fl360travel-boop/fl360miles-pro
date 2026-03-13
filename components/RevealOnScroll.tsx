
import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
    children: React.ReactNode;
    width?: "fit-content" | "100%";
    delay?: number; // ms
    direction?: "up" | "down" | "left" | "right";
    key?: string | number;
}

export const RevealOnScroll = ({ children, width = "100%", delay = 0, direction = "up" }: RevealProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);

                }
            },
            { threshold: 0.1, rootMargin: "-50px" }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, []);

    const getTransform = () => {
        if (!isVisible) {
            switch (direction) {
                case "up": return "translateY(50px)";
                case "down": return "translateY(-50px)";
                case "left": return "translateX(50px)";
                case "right": return "translateX(-50px)";
                default: return "translateY(50px)";
            }
        }
        return "translate(0, 0)";
    };

    return (
        <div
            ref={ref}
            style={{
                width,
                position: "relative",
            }}
        >
            <div
                style={{
                    transform: getTransform(),
                    opacity: isVisible ? 1 : 0,
                    transition: `all 0.8s cubic-bezier(0.17, 0.55, 0.55, 1) ${delay}ms`
                }}
            >
                {children}
            </div>
        </div>
    );
};
