import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const isTauri = '__TAURI_INTERNALS__' in window

async function openExternal(href: string) {
  if (isTauri) {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(href)
  } else {
    window.open(href, '_blank', 'noopener,noreferrer')
  }
}

/** Renders user Markdown (GitHub flavour). Raw HTML is not rendered; links open in the system browser. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: label }) => (
            <a
              href={href}
              onClick={e => {
                e.preventDefault()
                if (href && /^(https?:|mailto:)/i.test(href)) void openExternal(href)
              }}
            >
              {label}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
