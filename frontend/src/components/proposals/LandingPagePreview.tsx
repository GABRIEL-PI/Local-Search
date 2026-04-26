import { useState } from 'react'
import { ExternalLink, Code, Eye } from 'lucide-react'
import Button from '@/components/ui/Button'

interface LandingPagePreviewProps {
  html: string | null
  onEditHtml?: (html: string) => void
}

export default function LandingPagePreview({ html, onEditHtml }: LandingPagePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')

  const openInNewTab = () => {
    if (!html) return
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }

  if (!html) {
    return (
      <div className="flex items-center justify-center h-64 bg-zinc-950 rounded-xl border-2 border-dashed border-zinc-800">
        <p className="text-zinc-500 text-sm">Landing page não gerada ainda</p>
      </div>
    )
  }

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'preview'
                ? 'bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === 'code'
                ? 'bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            HTML
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={openInNewTab}>
          <ExternalLink className="w-4 h-4" />
          Abrir
        </Button>
      </div>

      {activeTab === 'preview' ? (
        <div className="relative" style={{ height: '500px' }}>
          <iframe
            srcDoc={html}
            title="Landing Page Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : (
        <div className="relative">
          <textarea
            value={html}
            onChange={(e) => onEditHtml?.(e.target.value)}
            className="w-full h-96 p-4 font-mono text-xs bg-zinc-100 text-green-400 focus:outline-none resize-none"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  )
}
