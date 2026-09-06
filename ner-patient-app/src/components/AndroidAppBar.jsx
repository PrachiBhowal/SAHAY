import './AndroidShell.css'

export default function AndroidAppBar({ patient, syncStatus, screen, onBack, onSwitchPatient, onOpenHelp }) {
    const isHome = screen === 'home'

    return (
        <header className="android-app-bar">
            <button className="android-app-bar-action" type="button" onClick={isHome ? onOpenHelp : onBack} aria-label={isHome ? 'Open help' : 'Go back'}>
                {isHome ? '?' : '\u2190'}
            </button>
            <div className="android-app-bar-title">
                <strong>SAHAY</strong>
                <span>{patient?.name || 'Patient'}{syncStatus === 'offline' ? ' · Offline' : ''}</span>
            </div>
            <button className="android-app-bar-switch" type="button" onClick={onSwitchPatient}>Switch</button>
        </header>
    )
}
