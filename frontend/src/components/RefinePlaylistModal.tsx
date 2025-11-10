import React from 'react'

interface RefinePlaylistModalProps {
  show: boolean
  onClose: () => void
  refinementPrompt: string
  onRefinementPromptChange: (value: string) => void
  refining: boolean
  onRefine: () => void
}

export const RefinePlaylistModal = ({
  show,
  onClose,
  refinementPrompt,
  onRefinementPromptChange,
  refining,
  onRefine
}: RefinePlaylistModalProps): React.JSX.Element | null => {
  if (!show) return null

  const handleClose = (): void => {
    onClose()
    onRefinementPromptChange('')
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Refine Playlist</h3>

        <p className="text-sm opacity-75 mb-4">
          Describe how you want to modify the current playlist. The AI will generate a new version
          based on your refinement instructions.
        </p>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Refinement Instructions</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-32"
            placeholder="e.g., Add more upbeat tracks, Remove anything slower than 120 BPM, Include more Beatles songs, Make it more energetic"
            value={refinementPrompt}
            onChange={e => {
              onRefinementPromptChange(e.target.value)
            }}
          ></textarea>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onRefine}
            disabled={refining || refinementPrompt.trim().length === 0}
          >
            {refining && <span className="loading loading-spinner"></span>}
            {refining ? 'Refining...' : 'Refine Playlist'}
          </button>
        </div>
      </div>
    </div>
  )
}
