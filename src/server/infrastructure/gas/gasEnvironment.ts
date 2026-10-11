import type { Environment } from "../../application/ports";

export const gasEnvironment: Environment = {
  name: "gas",
  describeStorage: () => {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    return spreadsheet ? `スプレッドシート「${spreadsheet.getName()}」` : "スプレッドシート未接続";
  },
  currentUserEmail: () => Session.getActiveUser().getEmail(),
  now: () => new Date(),
};
