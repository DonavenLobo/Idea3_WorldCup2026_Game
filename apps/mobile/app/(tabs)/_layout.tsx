import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="trivia" options={{ title: "Trivia" }} />
      <Tabs.Screen name="bracket" options={{ title: "Bracket" }} />
      <Tabs.Screen name="groups" options={{ title: "Groups" }} />
      <Tabs.Screen name="locker-room" options={{ title: "Locker Room" }} />
    </Tabs>
  );
}
