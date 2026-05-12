import { useEffect, useState } from 'react'
import { getOverview } from '../api'
import PriorityTracker from '../components/PriorityTracker'

export default function PriorityPage({ sessionId, onSessionExpired }) {
  const [overview, setOverview] = useState(null)

  useEffect(() => {
    getOverview(sessionId)
      .then(setOverview)
      .catch((err) => { if (err.sessionExpired) onSessionExpired() })
  }, [sessionId, onSessionExpired])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Priority Tracker</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Ranked by SLA urgency · preferred live date · ticket age. Excludes Closed Completed & Closed Rejected.
        </p>
      </div>
      <PriorityTracker
        sessionId={sessionId}
        onSessionExpired={onSessionExpired}
        overview={overview}
      />
    </div>
  )
}
