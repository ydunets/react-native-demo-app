import { useEffect, useState } from "react"
import { AppState, AppStateStatus } from "react-native"

export function useAppState() {
	const currentState = AppState.currentState
	const [appState, setAppState] = useState(currentState)

	useEffect(() => {
		function onChange(newState: AppStateStatus) {
      if(newState === "background") {
        console.log("App went into the background")
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