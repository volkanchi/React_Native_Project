import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  routeId: string;
  token: string;
}

export default function LiveTrackingScreen({ routeId, token }: Props) {
  return (
    <View style={styles.container}>
      <Text>Live tracking is available on Android and iOS.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});