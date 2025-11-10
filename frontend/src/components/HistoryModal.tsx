import React from 'react'
import type { PromptHistory } from '../../../shared/types'

interface HistoryModalProps {
  show: boolean
  onClose: () => void
  history: PromptHistory[] | undefined
  onSelectHistory: (item: PromptHistory) => void
}

export const HistoryModal = ({
  show,
  onClose,
  history,
  onSelectHistory
}: HistoryModalProps): React.JSX.Element | null => {
  if (!show) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Prompt History</h3>

        {(history ?? []).length === 0 ? (
          <p className="text-center py-8 text-base-content/50">
            No history yet. Create your first playlist!
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(history ?? []).map(item => (
              <div
                key={item.id}
                className="card bg-base-200 cursor-pointer hover:bg-base-300"
                onClick={() => {
                  onSelectHistory(item)
                }}
              >
                <div className="card-body p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold">{item.playlistName ?? 'Untitled'}</p>
                      <p className="text-sm opacity-75 mt-1">{item.prompt}</p>
                    </div>
                    <div className="text-xs opacity-50 ml-4">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-xs opacity-50">{item.trackCount} tracks</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
