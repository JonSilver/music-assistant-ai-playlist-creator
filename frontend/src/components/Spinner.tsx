import React from "react";

interface ISpinnerProps {
    size?: "xs" | "sm" | "md" | "lg";
}

export const Spinner: React.FC<ISpinnerProps> = ({ size = "md" }) => (
    <span className={`loading loading-spinner${size !== "md" ? ` loading-${size}` : ""}`}></span>
);
