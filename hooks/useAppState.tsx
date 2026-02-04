import { useEffect, useState } from "react"
import { AppState, AppStateStatus } from "react-native"
import { downloadQueueActions } from "@/stores/downloadQueue/valtioState"

export function useAppState() {
	const currentState = AppState.currentState
	const [appState, setAppState] = useState(currentState)

	useEffect(() => {
		function onChange(newState: AppStateStatus) {
      if(newState === "background") {
        console.log("App went into the background")
        // Pause download queue when app goes to background
        downloadQueueActions.pauseDueToBackground()
      } else if (newState === "active") {
        console.log("App came to foreground")
        // Resume download queue when app comes back to foreground
        downloadQueueActions.resumeProcessing()
      }
			setAppState(newState)
		}

		const subscription = AppState.addEventListener("change", onChange)

		return () => {
			subscription.remove()
		}
	}, [])

	return {
    isAppInBackground: appState === 'background',
    isAppInactive: appState === 'inactive',
    isAppActive: appState === 'active',
    appState,
  }
}