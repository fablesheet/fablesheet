import { useTranslation } from 'react-i18next'
import type { Dnd5eCharacter, Personality } from '@fablesheet/dnd5e'
import { MarkdownField, Notebook, Page } from '../../../components/journal/Notebook'
import { fieldCls, RULED } from '../../../components/journal/notebookStyles'

interface Props {
  character: Dnd5eCharacter
  onUpdate: (c: Dnd5eCharacter) => void
}

const PERSONALITY: Array<keyof Personality> = ['traits', 'ideals', 'bonds', 'flaws']

export function JournalView({ character, onUpdate }: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<Dnd5eCharacter>) => onUpdate({ ...character, ...patch })

  return (
    <Notebook>
      <Page side="left">
        <h2 className="font-display text-xl font-medium m-0 mb-2">{t('notes.personality')}</h2>
        {PERSONALITY.map(field => (
          <label key={field} className="block mb-3">
            <span className="fs-section-label">{t(`notes.${field}`)}</span>
            <textarea
              className={fieldCls}
              style={RULED}
              rows={2}
              value={character.personality[field]}
              onChange={e => update({ personality: { ...character.personality, [field]: e.target.value } })}
            />
          </label>
        ))}
        <MarkdownField
          label={t('notes.backstory')}
          value={character.backstory}
          placeholder={t('notes.backstoryPlaceholder')}
          rows={6}
          onChange={backstory => update({ backstory })}
        />
      </Page>
      <Page side="right">
        <MarkdownField
          label={t('notes.notes')}
          value={character.notes}
          placeholder={t('notes.notesPlaceholder')}
          rows={18}
          grow
          onChange={notes => update({ notes })}
        />
        <p className="text-xs italic text-fs-ink-muted m-0 mt-2">{t('notes.markdownHint')}</p>
      </Page>
    </Notebook>
  )
}
