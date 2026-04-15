import React from 'react'

export default function FeedbackButtons({ onFeedback, feedback }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        className={`btn btn-sm ${feedback === 'acertou' ? 'btn-neon' : 'btn-outline'}`}
        onClick={() => onFeedback(true)}
        disabled={feedback !== null}
        style={feedback === 'acertou' ? { opacity: 1 } : {}}
      >
        ✅ Acertou
      </button>
      <button
        className={`btn btn-sm ${feedback === 'errou' ? 'btn-outline' : 'btn-outline'}`}
        onClick={() => onFeedback(false)}
        disabled={feedback !== null}
        style={feedback === 'errou' ? { borderColor: 'var(--red)', color: 'var(--red)' } : {}}
      >
        ❌ Errou
      </button>
    </div>
  )
}
