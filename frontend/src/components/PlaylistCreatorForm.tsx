import React from 'react'

interface PlaylistCreatorFormProps {
  playlistName: string
  prompt: string
  generating: boolean
  onPlaylistNameChange: (value: string) => void
  onPromptChange: (value: string) => void
  onGenerate: () => void
}

export const PlaylistCreatorForm = ({
  playlistName,
  prompt,
  generating,
  onPlaylistNameChange,
  onPromptChange,
  onGenerate
}: PlaylistCreatorFormProps): React.JSX.Element => (
  <div className="card bg-base-100 shadow-xl mb-4">
    <div className="card-body">
      <h2 className="card-title">Create Playlist</h2>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Playlist Name</span>
        </label>
        <input
          type="text"
          placeholder="My Awesome Playlist"
          className="input input-bordered w-full"
          value={playlistName}
          onChange={e => {
            onPlaylistNameChange(e.target.value)
          }}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Describe your playlist</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24 w-full"
          placeholder="e.g., Upbeat workout music with rock and electronic tracks"
          value={prompt}
          onChange={e => {
            onPromptChange(e.target.value)
          }}
        ></textarea>
      </div>

      <div className="card-actions justify-end">
        <button
          className="btn btn-primary"
          onClick={onGenerate}
          disabled={generating || prompt.trim().length === 0 || playlistName.trim().length === 0}
        >
          {generating && <span className="loading loading-spinner"></span>}
          {generating ? 'Generating...' : 'Generate Playlist'}
        </button>
      </div>
    </div>
  </div>
)
