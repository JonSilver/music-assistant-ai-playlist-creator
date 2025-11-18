import React from "react";

interface IAlertMessageProps {
    type: "error" | "success";
    message: string;
    onDismiss: () => void;
}

const renderMessageWithLinks = (message: string): React.JSX.Element => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const messageText = message;
    const matches = Array.from(messageText.matchAll(linkRegex));

    if (matches.length === 0) {
        return <span>{message}</span>;
    }

    const processedParts = matches.reduce<{
        parts: (string | React.JSX.Element)[];
        lastIndex: number;
    }>(
        (acc, match) => {
            const fullMatch = match[0];
            const linkText = match[1];
            const url = match[2];
            const matchIndex = match.index;

            if (matchIndex > acc.lastIndex) {
                acc.parts.push(messageText.substring(acc.lastIndex, matchIndex));
            }

            acc.parts.push(
                <a
                    key={matchIndex}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary"
                >
                    {linkText}
                </a>
            );

            return {
                parts: acc.parts,
                lastIndex: matchIndex + fullMatch.length
            };
        },
        { parts: [], lastIndex: 0 }
    );

    if (processedParts.lastIndex < messageText.length) {
        processedParts.parts.push(messageText.substring(processedParts.lastIndex));
    }

    return <span>{processedParts.parts}</span>;
};

export const AlertMessage: React.FC<IAlertMessageProps> = ({ type, message, onDismiss }) => (
    <div className={`alert ${type === "error" ? "alert-error" : "alert-success"} mb-4`}>
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
        >
            {type === "error" ? (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            ) : (
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            )}
        </svg>
        {renderMessageWithLinks(message)}
        <button className="btn btn-sm btn-ghost" onClick={onDismiss}>
            ✕
        </button>
    </div>
);
