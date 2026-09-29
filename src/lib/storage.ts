const MY_PORTFOLIO_STORAGE_KEY = 'scale-me:my-portfolio'

// localStorage can throw (private browsing, blocked site data); remembering the
// portfolio is a convenience, so failures fall back to "not remembered".
export function loadMyPortfolio(): string {
  try {
    return localStorage.getItem(MY_PORTFOLIO_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveMyPortfolio(value: string): void {
  try {
    if (value.trim()) {
      localStorage.setItem(MY_PORTFOLIO_STORAGE_KEY, value)
    } else {
      localStorage.removeItem(MY_PORTFOLIO_STORAGE_KEY)
    }
  } catch {
    // Not persisting is acceptable; the calculator still works this session
  }
}
