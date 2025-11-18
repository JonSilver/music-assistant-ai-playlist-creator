import React from "react";

interface IDefaultSystemPromptModalProps {
    show: boolean;
    onClose: () => void;
}

const DEFAULT_SYSTEM_PROMPT = `You are a music playlist curator assistant. Your job is to create thoughtful, cohesive playlists based on user descriptions.

CRITICAL INSTRUCTION: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown code blocks. Do not add explanations. Start your response with { and end with }.

Required JSON format:
{
  "tracks": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name"
    }
  ],
  "reasoning": "Brief explanation of playlist curation choices"
}

Guidelines:
- Create 15-30 tracks unless user specifies otherwise
- Ensure good flow and cohesion
- Match the mood, genre, and era requested
- Include artist and album information for better matching
- Be specific with track titles and artist names
- Consider the user's favorite artists when relevant`;

export const DefaultSystemPromptModal: React.FC<IDefaultSystemPromptModalProps> = ({
    show,
    onClose
}) => (
    <dialog className={`modal ${show ? "modal-open" : ""}`}>
        <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Default System Prompt</h3>
            <div className="mb-4">
                <pre className="bg-base-200 p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {DEFAULT_SYSTEM_PROMPT}
                </pre>
            </div>
            <div className="alert alert-info">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>
                <span className="text-sm">
                    This prompt is automatically enhanced with your favorite artists when available.
                </span>
            </div>
            <div className="modal-action">
                <button className="btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
        <form method="dialog" className="modal-backdrop" onClick={onClose}>
            <button>close</button>
        </form>
    </dialog>
);
