import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function App() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 41.0082, // Başlangıç: İstanbul Enlem
          longitude: 28.9784, // Başlangıç: İstanbul Boylam
          latitudeDelta: 0.05, // Yakınlaşma derecesi
          longitudeDelta: 0.05,
        }}
      >
        {/* Örnek Bir Durak Pini */}
        <Marker
          coordinate={{ latitude: 41.0082, longitude: 28.9784 }}
          title="Biniş Durağım"
          description="Servis beni buradan alacak"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
