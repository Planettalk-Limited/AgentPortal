import { useTranslations } from 'next-intl'
import LanguageSelector from '@/components/LanguageSelector'
import LanguageSelectorMobile from '@/components/LanguageSelectorMobile'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function LanguageDemoPage() {
  const t = useTranslations('hero')

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-pt-dark-gray mb-8 text-center">
            Language Switching Components Demo
          </h1>

          {/* Current Translation Demo */}
          <div className="mb-12 p-6 bg-pt-turquoise/10 rounded-lg">
            <h2 className="text-xl font-semibold text-pt-dark-gray mb-4">Current Translation:</h2>
            <div className="space-y-2">
              <p><strong>Badge:</strong> {t('badge')}</p>
              <p><strong>Title:</strong> {t('title')}</p>
              <p><strong>Subtitle:</strong> {t('subtitle')}</p>
              <p><strong>Description:</strong> {t('description')}</p>
              <p><strong>Primary CTA:</strong> {t('ctaPrimary')}</p>
              <p><strong>Secondary CTA:</strong> {t('ctaSecondary')}</p>
            </div>
          </div>

          {/* Language Selector Variants */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Desktop Dropdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-pt-dark-gray">Desktop Dropdown</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <LanguageSelector />
              </div>
              <p className="text-sm text-pt-light-gray">
                Used in desktop header navigation. Hover to see dropdown.
              </p>
            </div>

            {/* Mobile Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-pt-dark-gray">Mobile Grid</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <LanguageSelectorMobile />
              </div>
              <p className="text-sm text-pt-light-gray">
                Used in mobile menu. Grid layout for easy touch interaction.
              </p>
            </div>

            {/* Compact Dropdown */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-pt-dark-gray">Compact Dropdown</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <LanguageSwitcher variant="dropdown" />
              </div>
              <p className="text-sm text-pt-light-gray">
                Compact version with country codes. Hover to see options.
              </p>
            </div>

            {/* Button Variant */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-pt-dark-gray">Button Grid</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <LanguageSwitcher variant="buttons" />
              </div>
              <p className="text-sm text-pt-light-gray">
                Button grid variant for settings pages or forms.
              </p>
            </div>

            {/* Minimal Variant */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-pt-dark-gray">Minimal Pills</h3>
              <div className="p-4 border border-gray-200 rounded-lg">
                <LanguageSwitcher variant="minimal" />
              </div>
              <p className="text-sm text-pt-light-gray">
                Minimal pill buttons showing only language codes.
              </p>
            </div>

            {/* Custom Styled */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-pt-dark-gray">Custom Styled</h3>
              <div className="p-4 border border-gray-200 rounded-lg bg-pt-dark-gray">
                <LanguageSwitcher 
                  variant="dropdown" 
                  className="[&_button]:bg-white [&_button]:text-pt-dark-gray [&_button]:border-white"
                />
              </div>
              <p className="text-sm text-pt-light-gray">
                Custom styling for dark backgrounds.
              </p>
            </div>
          </div>

          {/* Usage Instructions */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-pt-dark-gray mb-4">Usage Instructions:</h3>
            <div className="space-y-2 text-sm text-pt-dark-gray">
              <p><strong>URL Structure:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>English (default): <code>/</code>, <code>/auth/login</code></li>
                <li>French: <code>/fr/</code>, <code>/fr/auth/login</code></li>
                <li>Portuguese: <code>/pt/</code>, <code>/pt/auth/login</code></li>
                <li>Spanish: <code>/es/</code>, <code>/es/auth/login</code></li>
              </ul>
              <p className="mt-4"><strong>Components:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code>LanguageSelector</code> - Desktop dropdown</li>
                <li><code>LanguageSelectorMobile</code> - Mobile grid</li>
                <li><code>LanguageSwitcher</code> - Flexible with variants</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
