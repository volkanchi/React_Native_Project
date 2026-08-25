import React from "react";
import { useLocalSearchParams } from "expo-router";
import LiveTrackingScreen from "../screens/LiveTrackingScreen";

export default function HomeScreen() {
  const { routeId, token } = useLocalSearchParams<{
    routeId: string;
    token: string;
  }>();

  return <LiveTrackingScreen routeId={routeId} token={token} />;
}
