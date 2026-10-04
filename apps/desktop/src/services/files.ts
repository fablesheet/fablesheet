// Saving and opening JSON files: native dialogs on desktop, browser download/upload on web.

const isTauri = '__TAURI_INTERNALS__' in window
const JSON_FILTER = { name: 'JSON', extensions: ['json'] }

/** Asks where to save and writes the data. Returns false if the user cancelled. */
export async function saveJsonFile(suggestedName: string, data: unknown): Promise<boolean> {
  const text = JSON.stringify(data, null, 2)

  if (isTauri) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')
    const path = await save({ defaultPath: suggestedName, filters: [JSON_FILTER] })
    if (!path) return false
    await writeTextFile(path, text)
    return true
  }

  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = suggestedName
  a.click()
  URL.revokeObjectURL(url)
  return true
}

/** Lets the user pick a JSON file and returns its parsed content, or null if cancelled. */
export async function openJsonFile(): Promise<unknown | null> {
  if (isTauri) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { readTextFile } = await import('@tauri-apps/plugin-fs')
    const path = await open({ multiple: false, directory: false, filters: [JSON_FILTER] })
    if (!path) return null
    return JSON.parse(await readTextFile(path))
  }

  const file = await new Promise<File | null>(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
  return file ? JSON.parse(await file.text()) : null
}
