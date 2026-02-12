const ONBOARDING_KEY = 'groupsync-onboarding-seen';

export function hasSeenOnboarding(): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function markOnboardingSeen(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(ONBOARDING_KEY, 'true');
}
