// src/App.jsx
import { useState } from 'react'
import HomeScreen from './HomeScreen'
import Game1FamilyRecognition from './games/Game1FamilyRecognition'
import Game3Screen from './person3/game3/Game3Screen'
import './tokens.css'

function App() {
  const [screen, setScreen] = useState('home')

  return (
    <div>
      {screen === 'home' && (
        <HomeScreen
          onSelectGame={(gameId) => setScreen(gameId)}
          onOpenReminders={() => setScreen('reminders')}
        />
      )}

      {screen === 'memory' && (
        <Game1FamilyRecognition onBack={() => setScreen('home')} />
      )}

      {screen === 'recall' && (
        <Game3Screen onBack={() => setScreen('home')} />
      )}

      {screen === 'reminders' && (
        <div style={{ padding: 24, fontFamily: 'var(--font-body)' }}>
          <button
            onClick={() => setScreen('home')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)'
            }}
          >
            &#8592; Back
          </button>
          <p>Reminders — Person 5/6's territory, stub for now.</p>
        </div>
      )}
    </div>
  )
}

export default App