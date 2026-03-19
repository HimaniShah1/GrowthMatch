// import { Redirect } from 'expo-router';

// export default function IndexScreen() {
//   return <Redirect href={'/(auth)/login' as never} />;
// }
import { Text, View } from "react-native";

export default function IndexScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Loading...</Text>
    </View>
  );
}
