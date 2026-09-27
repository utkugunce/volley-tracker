import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateRibbon } from "../DateRibbon";

describe("DateRibbon", () => {
  it("formats fixture dates as stable calendar dates", () => {
    render(
      <DateRibbon
        dates={["2026-09-27"]}
        selectedDate="all"
        onSelectDate={vi.fn()}
        dateCounts={{ "2026-09-27": 1 }}
        todayStr="2026-09-25"
      />
    );

    expect(screen.getByRole("tab", { name: "PAZ 27 Eyl, 1 maç" })).toBeInTheDocument();
  });
});