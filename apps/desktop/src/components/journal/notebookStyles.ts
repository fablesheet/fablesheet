/** Faint ruled lines like a notebook page */
export const RULED = {
  backgroundImage:
    'repeating-linear-gradient(to bottom, transparent 0, transparent 27px, rgba(122,98,70,0.16) 27px, rgba(122,98,70,0.16) 28px)',
  backgroundAttachment: 'local' as const,
}

export const fieldCls =
  'fs-focus w-full bg-transparent border-none outline-none resize-none text-[0.95rem] leading-[28px] text-fs-ink placeholder:text-fs-ink-muted placeholder:italic'
