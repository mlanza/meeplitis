export function describe(config){
  const descriptors = [];
  if (config.start === 7 && config.end === 1) {
    descriptors.push("Down and Up Variant");
  }
  return descriptors;
}
