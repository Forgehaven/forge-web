export function BottomBar({ children }: { children?: React.ReactNode }) {
  return (
    <footer className="h-10 bg-forge-surface border-t border-forge-border flex items-center px-2 sm:px-4 gap-1.5 sm:gap-3 text-xs shrink-0 overflow-hidden">
      {children}
    </footer>
  )
}

export function BottomBarDivider() {
  return <span className="text-forge-border select-none">|</span>
}
