import { randomUUID } from "crypto";
import { ingestLead } from "../leads/leads.service";

// Public capture deliberately does not send messages. Use the caller's transaction
// so registration, attribution and the visit are committed together.
export async function captureLead(
  client: any,
  input: {
    name: string;
    phone: string;
    city?: string;
    interest?: string;
    campaign: string;
  },
) {
  if (!client)
    return ingestLead({
      ...input,
      channel: "web_form",
      campaignName: input.campaign,
      interestTopic: input.interest,
      triggerAutomations: false,
    });
  const person = (
    await client.query(
      `INSERT INTO people(id,phone,name,city) VALUES($1,$2,$3,$4)
    ON CONFLICT(phone) DO UPDATE SET name=EXCLUDED.name,city=COALESCE(EXCLUDED.city,people.city),updated_at=now() RETURNING id`,
      [randomUUID(), input.phone, input.name, input.city || null],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO leads(phone_number,coach_id,person_id,display_name,interest_topic,next_action,next_action_due,lead_score)
    VALUES($1,'coach_deepa',$2,$3,$4,'Follow up on website enquiry',now()+interval '1 day',60)
    ON CONFLICT(phone_number) DO UPDATE SET display_name=EXCLUDED.display_name,person_id=EXCLUDED.person_id,updated_at=now()`,
    [input.phone, person.id, input.name, input.interest || "Wellness session"],
  );
  await client.query(
    `INSERT INTO lead_sources(person_id,channel,campaign_name,consent_given) VALUES($1,'web_form',$2,true)`,
    [person.id, input.campaign],
  );
  await client.query(
    `INSERT INTO activities(coach_id,phone_number,type,summary) VALUES('coach_deepa',$1,'SYSTEM',$2)`,
    [input.phone, `Enquiry received: ${input.campaign}`],
  );
}
