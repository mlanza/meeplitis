export function fmttime(date, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const yyyy = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric"
  });
  const mm = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "2-digit"
  });
  const dd = new Intl.DateTimeFormat("en-US", {
    timeZone,
    day: "2-digit"
  });
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit"
  });
  const dt = tzadjust(date);
  return `${yyyy.format(dt)}-${mm.format(dt)}-${dd.format(dt)}, ${time.format(dt)}`;
}

function tzadjust(date){
  const dt = new Date(date);
  return new Date(dt.getTime() - (dt.getTimezoneOffset() * 60000));
}
