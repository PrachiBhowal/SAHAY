import './AndroidShell.css'

const tabs = [
    { id: 'home', label: 'Home', icon: '\u2302' },
    { id: 'reminders', label: 'Reminders', icon: '\u25f7' },
    { id: 'still-useful', label: 'Memories', icon: '\u25c7' },
]

export default function AndroidBottomNav({ activeTab, onNavigate, onSwitchPatient }) {
    return (
        <nav className="android-bottom-nav" aria-label="Patient app navigation">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    type="button"
                    className={activeTab === tab.id ? 'is-active' : ''}
                    onClick={() => onNavigate(tab.id)}
                >
                    <span aria-hidden="true">{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
            <button type="button" onClick={onSwitchPatient}>
                <span aria-hidden="true">&#9679;</span>
                Switch
            </button>
        </nav>
    )
}
