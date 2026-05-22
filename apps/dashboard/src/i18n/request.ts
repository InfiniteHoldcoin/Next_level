import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

type Locale = 'fr' | 'en';
const SUPPORTED: Locale[] = ['fr', 'en'];

export default getRequestConfig(async () => {
  const raw = (await cookies()).get('locale')?.value;
  const locale: Locale = SUPPORTED.includes(raw as Locale) ? (raw as Locale) : 'fr';
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
