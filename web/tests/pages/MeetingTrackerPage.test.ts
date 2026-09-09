import { expect, it } from "vitest";
import { parseWhatsAppMeeting } from "../../src/pages/MeetingTrackerPage";

it("extracts all meeting details from a WhatsApp invitation", () => {
  expect(
    parseWhatsAppMeeting(`Topic : Mind , Body and Soul
Date : 7thsep 2026
Time : 7:30am
Join Zoom Meeting
https://us06web.zoom.us/j/81607938844?pwd=secret
Meeting ID: 816 0793 8844 Passcode: 1234|`),
  ).toEqual({
    topic: "Mind , Body and Soul",
    date: "7thsep 2026",
    time: "7:30am",
    destinationUrl: "https://us06web.zoom.us/j/81607938844?pwd=secret",
    meetingId: "816 0793 8844",
    passcode: "1234",
  });
});
