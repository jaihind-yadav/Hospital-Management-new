const { getKolkataDateTime } = require("../utils/dateTime");

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

const formatResponseValue = (value) => {
  if (value instanceof Date) {
    return getKolkataDateTime(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatResponseValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, formatResponseValue(entry)])
    );
  }

  if (typeof value === "string") {
    if (DATE_ONLY_PATTERN.test(value)) {
      return `${value} 00:00:00`;
    }
    if (DATETIME_PATTERN.test(value)) {
      return getKolkataDateTime(value);
    }
  }

  return value;
};

const responseDateFormatter = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (payload) => originalJson(formatResponseValue(payload));
  next();
};

module.exports = {
  responseDateFormatter,
};
