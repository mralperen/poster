interface DeviceOrientationEventConstructor {
  requestPermission?: () => Promise<"granted" | "denied">;
}
