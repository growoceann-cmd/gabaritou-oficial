import React, { useState } from 'react'

export default function ShareButton({ concurso, acuracia, totalQuestoes }) {
  const [copied, setCopied] = useState(false)

  const shareText = `🎯 Gabaritou previu ${acuracia}% das questões do ${concurso}!\n\n${totalQuestoes} questões mapeadas com IA.\n\nTeste você também: gabaritou.com.br`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gabaritou — Resultado de Predição',
          text: shareText,
        })
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard()
        }
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = shareText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <button
        className="btn btn-primary btn-sm"
        onClick={handleShare}
      >
        📤 Compartilhar
      </button>
      {copied && (
        <span style={{ fontSize: '0.82rem', color: 'var(--neon)', fontWeight: 600 }}>
          ✅ Compartilhado!
        </span>
      )}
    </div>
  )
}
