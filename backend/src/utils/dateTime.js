const KOLKATA_TIME_ZONE = "Asia/Kolkata";

const toDate = (value) => {
  if (value instanceof Date) return value;
  return new Date(value);
};

const formatParts = (date) => {
  const normalizedDate = toDate(date);
  if (Number.isNaN(normalizedDate.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KOLKATA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const mapped = Object.fromEntries(
    formatter
      .formatToParts(normalizedDate)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return mapped;
};

const getKolkataDateTime = (date = new Date()) => {
  const parts = formatParts(date);
  if (!parts) return "";
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const getKolkataDate = (date = new Date()) => getKolkataDateTime(date).slice(0, 10);

const normalizeKolkataDateTimeInput = (value) => {
  const fallbackDateTime = getKolkataDateTime();

  if (!value) return fallbackDateTime;

  const normalizedValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return `${normalizedValue} ${fallbackDateTime.slice(11)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(normalizedValue)) {
    return `${normalizedValue}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  return getKolkataDateTime(normalizedValue);
};

module.exports = {
  KOLKATA_TIME_ZONE,
  getKolkataDate,
  getKolkataDateTime,
  normalizeKolkataDateTimeInput,
};
