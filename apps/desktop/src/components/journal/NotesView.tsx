import { useTranslation } from 'react-i18next'
import type { CharacterBase } from '@fablesheet/core'
import { MarkdownField, Notebook, Page } from './Notebook'

interface Props<C extends CharacterBase> {
  character: C
  onUpdate: (character: C) => void
}

/** A notebook with free Markdown notes, for every game system. */
export function NotesView<C extends CharacterBase>({ character, onUpdate }: Props<C>) {
  const { t } = useTranslation()
  return (
    <Notebook>
      <Page side="left">
        <MarkdownField
          label={t('notes.notes')}
          value={character.notes}
          placeholder={t('notes.notesPlaceholder')}
          rows={18}
          grow
          onChange={notes => onUpdate({ ...character, notes })}
        />
        <p className="text-xs italic text-fs-ink-muted m-0 mt-2">{t('notes.markdownHint')}</p>
      </Page>
    </Notebook>
  )
}
