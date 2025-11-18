import React from "react";

interface ILoadingButtonProps {
    loading: boolean;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
    loadingText?: string;
    children: React.ReactNode;
    type?: "button" | "submit" | "reset";
}

export const LoadingButton: React.FC<ILoadingButtonProps> = ({
    loading,
    disabled = false,
    onClick,
    className = "btn btn-primary",
    loadingText,
    children,
    type = "button"
}) => {
    return (
        <button type={type} className={className} onClick={onClick} disabled={disabled || loading}>
            {loading && <span className="loading loading-spinner"></span>}
            {loading && loadingText !== undefined ? loadingText : children}
        </button>
    );
};
