export const APP_TIME_ZONE = "Asia/Kolkata";

const partsFromDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
};

export const formatDateTime = (value) => {
  if (!value) return "-";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value} 00:00:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const parts = partsFromDate(value);
  if (!parts) return String(value);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

export const formatDateTimeFromParts = (dateValue, timeValue = "00:00:00") => {
  if (!dateValue) return "-";
  const normalizedTime = /^\d{2}:\d{2}:\d{2}$/.test(timeValue)
    ? timeValue
    : /^\d{2}:\d{2}$/.test(timeValue)
      ? `${timeValue}:00`
      : "00:00:00";
  return `${String(dateValue).slice(0, 10)} ${normalizedTime}`;
};

export const getTodayDate = () => {
  const parts = partsFromDate(new Date());
  return parts ? `${parts.year}-${parts.month}-${parts.day}` : "";
};

export const getCurrentDateTimeLocal = () => {
  const parts = partsFromDate(new Date());
  return parts ? `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` : "";
};

export const normalizeDateTimeLocalToApi = (value) => {
  if (!value) return "";

  const normalizedValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalizedValue)) {
    return normalizedValue.replace("T", " ") + ":00";
  }

  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(normalizedValue)) {
    return `${normalizedValue}:00`;
  }

  return normalizedValue.replace("T", " ");
};
