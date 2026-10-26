import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SyncRefreshButton } from "../SyncRefreshButton";

describe("SyncRefreshButton", () => {
  it("renders null as refresh button has been removed from the site", () => {
    const { container } = render(<SyncRefreshButton lastSyncTime="2026-10-23T12:41:00.000Z" />);
    expect(container.firstChild).toBeNull();
  });
});
