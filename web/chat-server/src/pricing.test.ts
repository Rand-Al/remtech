import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPrice,
  getDiagnosticPrice,
  getPriceItem,
} from "../../shared/pricing.js";

test("formats shared prices for Ukrainian and Russian interfaces", () => {
  assert.equal(formatPrice(getPriceItem("visit-brovary").value, "uk"), "400 грн");
  assert.equal(
    formatPrice(getPriceItem("boiler-diagnostics").value, "ru"),
    "500–800 грн"
  );
  assert.equal(
    formatPrice(getPriceItem("boiler-maintenance").value, "uk"),
    "від 1 500 грн"
  );
});

test("returns a diagnostic price only for services covered by the catalog", () => {
  assert.ok(getDiagnosticPrice("boiler-repair"));
  assert.equal(getDiagnosticPrice("washer"), null);
});
