import { createContext, useContext, useEffect, type ReactNode } from 'react';

const messages = {
  welcome: 'Welcome back', signInTitle: 'Sign in to Tutiba', signInDescription: 'Enter your details to continue your learning journey.',
  email: 'Email address', password: 'Password', forgot: 'Forgot Password', signingIn: 'Signing in…', signIn: 'Sign in',
  noAccount: 'Don’t have an account?', signUp: 'Sign up', backHome: 'Back to Tutiba home', about: 'About Tutiba',
  evidence: 'Evidence-based education', confidence: 'Continue building practical confidence in cosmeceuticals.',
  access: 'Access your courses, learning progress, and professional education in one secure place.', pace: 'Learn at your own pace',
  secure: 'Your account is protected by secure authentication', support: 'Contact support', privacy: 'Privacy', terms: 'Terms', caps: 'Caps Lock is on.',
} as const;
type MessageKey = keyof typeof messages;
interface LocaleValue { locale: 'en'; dir: 'ltr'; t: (key: MessageKey) => string }
const Context = createContext<LocaleValue>({ locale: 'en', dir: 'ltr', t: key => messages[key] });
export function LocaleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    window.localStorage.removeItem('tutiba-locale');
  }, []);
  return <Context.Provider value={{ locale: 'en', dir: 'ltr', t: key => messages[key] }}>{children}</Context.Provider>;
}
export const useLocale = () => useContext(Context);
