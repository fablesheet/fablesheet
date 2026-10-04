import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage, type LanguageCode } from '../i18n'
import { setThemePreference, useThemePreference, type ThemePreference } from '../settings/theme'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'
import { Segmented } from './ui/Segmented'

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const theme = useThemePreference()

  return (
    <Dialog
      title={t('settings.title')}
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          {t('settings.done')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="fs-section-label">{t('settings.appearance')}</span>
          <Segmented<ThemePreference>
            label={t('settings.appearance')}
            value={theme}
            onChange={setThemePreference}
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="fs-section-label">{t('common.language')}</span>
          <Segmented<LanguageCode>
            label={t('common.language')}
            value={(i18n.resolvedLanguage as LanguageCode) ?? 'en'}
            onChange={setLanguage}
            options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
          />
        </div>
      </div>
    </Dialog>
  )
}
