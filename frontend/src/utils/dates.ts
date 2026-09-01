const MONTHS: Record<string, string> = {
  jan: "Jan", january: "Jan",
  feb: "Feb", february: "Feb",
  mar: "Mar", march: "Mar",
  apr: "Apr", april: "Apr",
  may: "May",
  jun: "Jun", june: "Jun",
  jul: "Jul", july: "Jul",
  aug: "Aug", august: "Aug",
  sep: "Sep", sept: "Sep", september: "Sep",
  oct: "Oct", october: "Oct",
  nov: "Nov", november: "Nov",
  dec: "Dec", december: "Dec",
};

const MONTH_BY_NUMBER = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const RANGE_SPLIT = /\s*–\s*|\s*—\s*|\s+-\s+|\s+(?:to|until|thru|through)\s+/i;

const formatMonthYear = (month: string, year: string) => `${month} ${year}`;

const fourDigitYear = (raw: string): string | null => {
  if (/^\d{4}$/.test(raw)) return raw;
  if (/^\d{2}$/.test(raw)) {
    const year = Number(raw);
    return String(year >= 50 ? 1900 + year : 2000 + year);
  }
  return null;
};

const monthFromNumber = (raw: string): string | null => {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 12) return null;
  return MONTH_BY_NUMBER[value];
};

/** Convert common resume dates to `MMM YYYY` (e.g. Apr 2024) or `Present`. */
export const normalizeResumeDate = (value: string, allowPresent = true): string => {
  const raw = (value || "").trim();
  if (!raw) return "";
  if (/^(present|current|now|ongoing)$/i.test(raw)) {
    return allowPresent ? "Present" : "";
  }

  const named = raw.match(/\b([A-Za-z]+)\.?,?\s+'?(\d{2}|\d{4})\b/);
  if (named) {
    const month = MONTHS[named[1].toLowerCase()];
    const year = fourDigitYear(named[2]);
    if (month && year) return formatMonthYear(month, year);
  }

  const numeric = raw.match(/\b(\d{1,2})[/\-.](\d{2}|\d{4})\b/)
    || raw.match(/\b(\d{4})[/\-.](\d{1,2})(?:[/\-.]\d{1,2})?\b/);
  if (numeric) {
    const first = numeric[1];
    const second = numeric[2];
    if (first.length === 4) {
      const month = monthFromNumber(second);
      if (month) return formatMonthYear(month, first);
    } else {
      const month = monthFromNumber(first);
      const year = fourDigitYear(second);
      if (month && year) return formatMonthYear(month, year);
    }
  }

  return raw;
};

export const parseExperienceDates = (startRaw: string, endRaw: string): { startDate: string; endDate: string } => {
  let start = (startRaw || "").trim();
  let end = (endRaw || "").trim();

  if (start && !end && RANGE_SPLIT.test(start)) {
    const [left, right] = start.split(RANGE_SPLIT).filter(Boolean);
    start = left || "";
    end = right || "";
  }

  return {
    startDate: normalizeResumeDate(start, false),
    endDate: normalizeResumeDate(end, true),
  };
};
