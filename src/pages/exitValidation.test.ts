import { describe, expect, it } from "vitest";
import { missingExitEvidence, validateExitDraft } from "./exitValidation";

describe("member exit request validation", () => {
  const category = { active: true, duration_options: ["temporary", "remaining_period"], emergency_medical: false };

  it("requires a reason and valid ordered dates before creating a request", () => {
    expect(validateExitDraft({ category, duration: "temporary", reason: "family", depart_at: "2030-01-02T10:00", return_at: "2030-01-01T10:00", urgent: false }, Date.parse("2029-01-01"))).toContain("Choose a return time after departure.");
    expect(validateExitDraft({ category, duration: "temporary", reason: "no", depart_at: "2030-01-02T10:00", return_at: "2030-01-03T10:00", urgent: false }, Date.parse("2029-01-01"))).toContain("Enter a reason with at least five characters.");
  });

  it("allows a past departure only for a configured urgent medical category", () => {
    const request = { category: { ...category, emergency_medical: true }, duration: "temporary", reason: "urgent treatment", depart_at: "2020-01-01T10:00", return_at: "2020-01-02T10:00", urgent: true };
    expect(validateExitDraft(request, Date.now())).toEqual([]);
    expect(validateExitDraft({ ...request, category, urgent: true }, Date.now())).toContain("Departure must be in the future unless this is an urgent medical request.");
  });

  it("accepts one uploaded member of an alternative evidence group and blocks rejected evidence", () => {
    const request: any = { documents: [{ document_type_id: "marriage-cert", review_status: "pending_review" }] };
    const category = { document_types: [{ id: "marriage-cert", name: "Marriage certificate" }, { id: "publication", name: "Publication" }], required_document_groups: [["marriage-cert", "publication"]] };
    expect(missingExitEvidence(request, category)).toEqual([]);
    request.documents[0].review_status = "replacement_required";
    expect(missingExitEvidence(request, category)).toEqual(["one of: Marriage certificate, Publication"]);
  });

  it("requires a fresh upload after the Camp Director requests additional evidence", () => {
    const category = { document_types: [{ id: "identity", name: "Identity document" }] };
    const request = { requirements_snapshot: { additional_requirements: [{ document_type_ids: ["identity"], reason: "Provide an updated copy", requested_at: "2030-01-02T00:00:00.000Z" }] }, documents: [{ document_type_id: "identity", review_status: "accepted", uploaded_at: "2030-01-01T00:00:00.000Z" }] };
    expect(missingExitEvidence(request, category)).toEqual(["Provide an updated copy"]);
  });
});
