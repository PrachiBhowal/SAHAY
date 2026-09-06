import { useEffect, useState } from 'react'

export default function Countdown({ seconds = 5, onComplete, onCancel }) {
    const [remaining, setRemaining] = useState(seconds)

    useEffect(() => {
        const timer = window.setInterval(() => {
            setRemaining(value => {
                if (value <= 1) {
                    window.clearInterval(timer)
                    onComplete()
                    return 0
                }
                return value - 1
            })
        }, 1000)
        return () => window.clearInterval(timer)
    }, [onComplete, seconds])

    return (
        <section className="game-countdown" aria-live="polite">
            <p>Get ready</p>
            <strong>{remaining}</strong>
            <button type="button" onClick={onCancel}>Back</button>
        </section>
    )
}
