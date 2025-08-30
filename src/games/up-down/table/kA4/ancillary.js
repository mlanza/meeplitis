export function describe(config){
  const descriptors = [];
  if (config.start > config.end) {
    descriptors.push("Down and Up Variant");
  }
  return descriptors;
}
