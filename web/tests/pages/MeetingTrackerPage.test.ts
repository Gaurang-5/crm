import { expect, it } from "vitest";
import {
  activityDateRange,
  buildInvitationMessage,
  funnelPercent,
  parseWhatsAppMeeting,
} from "../../src/pages/MeetingTrackerPage";

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

it("uses an inclusive rolling seven-day activity window", () => {
  expect(activityDateRange("7d", new Date(2026, 8, 9, 12))).toEqual({
    from: "2026-09-03",
    to: "2026-09-09",
    label: "3–9 Sept 2026",
  });
});

it("formats a WhatsApp invitation with the custom link and no Zoom form instruction", () => {
  const message = buildInvitationMessage(
    {
      id: "meeting-1",
      status: "ACTIVE",
      topic: "Mind, Body and Soul",
      meeting_date: "10 Sep 2026",
      meeting_time: "7:30am",
      destination_url: "https://zoom.us/j/secret",
      meeting_id: "123",
      passcode: "1234",
      created_at: "2026-09-09T10:00:00.000Z",
    },
    "https://lifestylemantra.in/join",
  );

  expect(message).toContain("*Topic:* Mind, Body and Soul");
  expect(message).toContain("https://lifestylemantra.in/join");
  expect(message).not.toContain("zoom.us");
  expect(message).not.toContain("enter your name and phone number");
});

it("calculates funnel conversion safely", () => {
  expect(funnelPercent(2, 6)).toBe(33);
  expect(funnelPercent(0, 0)).toBe(0);
});
