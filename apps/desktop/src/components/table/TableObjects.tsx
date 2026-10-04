// Flat illustrations of the objects on the character's table, drawn with CSS.

export function SheetArt({ initial }: { initial: string }) {
  return (
    <div className="w-28 h-36 bg-fs-card border border-fs-card-line rounded-sm -rotate-3 px-2.5 py-3 shadow-lg">
      <div className="font-display text-[0.6rem] text-fs-ink border-b border-fs-card-line pb-1">{initial}</div>
      <div className="grid grid-cols-3 gap-1 mt-2">
        {['+3', '+2', '−1', '+1', '+2', '+0'].map((v, i) => (
          <div
            key={i}
            className="border border-fs-card-line rounded-[3px] text-center text-[0.55rem] text-fs-ink py-0.5"
          >
            {v}
          </div>
        ))}
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-0.5 bg-fs-card-line rounded mt-2" />
      ))}
    </div>
  )
}

export function BookArt() {
  return (
    <div className="relative w-26 h-34 bg-fs-leather rounded-[3px_8px_8px_3px] border-l-[9px] border-fs-leather-dark rotate-3 shadow-lg">
      <div className="absolute inset-x-2.5 inset-y-3 border border-fs-accent rounded-[3px]" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 size-5 border-[1.5px] border-fs-accent" />
      <div
        className="absolute -bottom-3.5 right-6 w-2 h-6 bg-fs-danger"
        style={{ clipPath: 'polygon(0 0,100% 0,100% 100%,50% 75%,0 100%)' }}
      />
    </div>
  )
}

export function BackpackArt() {
  return (
    <div className="relative w-28 h-30 mt-3">
      <div className="absolute left-8 -top-3 w-12 h-7 border-[5px] border-b-0 border-[#6b4a2e] rounded-t-full" />
      <div className="absolute inset-0 bg-[#7a5536] rounded-[22px_22px_14px_14px] shadow-lg" />
      <div className="absolute inset-x-2 top-1.5 h-11 bg-[#6b4a2e] rounded-[18px_18px_8px_8px]" />
      <div className="absolute left-1/2 -translate-x-1/2 top-10 w-3 h-3.5 bg-fs-accent rounded-sm" />
      <div className="absolute inset-x-4 bottom-3.5 h-8 border-[1.5px] border-dashed border-[#a07a52] rounded-lg" />
    </div>
  )
}

export function JournalArt({ label }: { label: string }) {
  return (
    <div className="relative w-24 h-32 bg-[#3a4a3a] rounded-[4px_10px_10px_4px] -rotate-2 mt-1 shadow-lg">
      <div className="absolute -right-1.5 top-12 w-4 h-6 bg-[#2c3a2c] rounded-r-md" />
      <div className="absolute inset-x-3 top-3.5 h-8 bg-fs-card rounded-sm flex items-center justify-center font-display text-[0.55rem] text-fs-ink tracking-widest">
        {label.toUpperCase()}
      </div>
    </div>
  )
}

export function DiceArt() {
  return (
    <div className="relative size-26 mt-6 rounded-full bg-[#1f2d24] border-4 border-fs-leather shadow-lg flex items-center justify-center">
      <div
        className="size-11 bg-fs-accent flex items-center justify-center font-display text-sm text-fs-on-accent rotate-6"
        style={{ clipPath: 'polygon(50% 1%, 95% 26%, 95% 74%, 50% 99%, 5% 74%, 5% 26%)' }}
      >
        20
      </div>
      <div
        className="absolute right-4 bottom-5 size-6 bg-fs-card -rotate-12 flex items-center justify-center font-display text-[0.6rem] text-fs-ink"
        style={{ clipPath: 'polygon(10% 10%, 90% 10%, 90% 90%, 10% 90%)' }}
      >
        6
      </div>
    </div>
  )
}
