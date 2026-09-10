import assert from "node:assert/strict";
import test from "node:test";
import messages from "../src/lib/i18n/messages.json";
import {
  createTranslator,
  isLocale,
  locales,
  resolveLocale,
} from "../src/lib/i18n";
import { formatCents, formatDate, timeAgo } from "../src/lib/utils";

// Every supported language must provide the same message and interpolation keys.
test("French and Arabic dictionaries are complete and preserve placeholders", () => {
  const placeholders = (text: string) =>
    [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
  for (const [key, entry] of Object.entries(messages)) {
    for (const locale of ["fr", "ar"] as const) {
      assert.ok(entry[locale].trim(), `${locale}: ${key}`);
      assert.deepEqual(
        placeholders(entry[locale]),
        placeholders(key),
        `${locale}: ${key}`,
      );
    }
  }
});

test("untrusted and unsupported locale preferences fall back to English", () => {
  for (const value of [undefined, null, "", "de", "../../ar", "ar; Path=/"]) {
    assert.equal(resolveLocale(value), "en");
    assert.equal(isLocale(value), false);
  }
  for (const locale of locales) assert.equal(resolveLocale(locale), locale);
});

test("UI translations are deterministic and preserve names and unknown content", () => {
  assert.equal(createTranslator("fr")("Book a table"), "Réserver une table");
  assert.equal(createTranslator("ar")("Book a table"), "احجز طاولة");
  assert.equal(createTranslator("en")("Book a table"), "Book a table");
  assert.equal(
    createTranslator("ar")("An original tournament description"),
    "An original tournament description",
  );
  assert.equal(
    createTranslator("ar")("Table booked for {name}", { name: "Jean & أحمد" }),
    "تم حجز طاولة للاعب Jean & أحمد",
  );
  assert.equal(
    createTranslator("en")("Table booked for {name}", { name: "Jean" }),
    "Table booked for Jean",
  );
});

test("legacy notification templates translate without altering embedded user content", () => {
  assert.equal(
    createTranslator("fr")("Table booked for Jean & أحمد"),
    "Table réservée pour Jean & أحمد",
  );
  assert.equal(
    createTranslator("ar")("New tournament: Summer Open"),
    "بطولة جديدة: Summer Open",
  );
  assert.equal(
    createTranslator("fr")("New tournament? Summer Open"),
    "New tournament? Summer Open",
  );
  assert.equal(createTranslator("fr")(" (me)"), " (moi)");
});

test("dates, currency and relative time honor the selected locale", () => {
  assert.equal(
    formatCents(1200, "fr-FR"),
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(12),
  );
  assert.match(formatDate(new Date(2030, 8, 10), "fr-FR"), /sept/);
  assert.notEqual(
    formatDate(new Date(2030, 8, 10), "ar-MA"),
    formatDate(new Date(2030, 8, 10), "en-US"),
  );
  assert.equal(timeAgo(new Date(), "fr-FR"), "maintenant");
});
