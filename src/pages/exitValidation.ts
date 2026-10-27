type Category = { active?: boolean; emergency_medical?: boolean; duration_options?: string[] };

export function validateExitDraft(input: { category?: Category; duration: string; reason: string; depart_at: string; return_at: string; urgent: boolean }, now = Date.now()): string[] {
  const errors: string[] = [];
  if (!input.category?.active) errors.push("Choose an available exit category.");
  if (!input.category?.duration_options?.includes(input.duration)) errors.push("Choose a duration allowed for this category.");
  if (input.reason.trim().length < 5) errors.push("Enter a reason with at least five characters.");
  const departure = Date.parse(input.depart_at);
  if (!Number.isFinite(departure)) errors.push("Choose a valid departure date and time.");
  else if (departure <= now && !(input.urgent && input.category?.emergency_medical)) errors.push("Departure must be in the future unless this is an urgent medical request.");
  if (input.duration === "temporary") {
    const expectedReturn = Date.parse(input.return_at);
    if (!Number.isFinite(expectedReturn) || !Number.isFinite(departure) || expectedReturn <= departure) errors.push("Choose a return time after departure.");
  }
  if (input.urgent && !input.category?.emergency_medical) errors.push("Urgent handling is available only for categories enabled by the Camp Director.");
  return errors;
}

export function missingExitEvidence(request: any, category?: any): string[] {
  const rules = request.requirements_snapshot || category || {};
  const documents = request.documents || [];
  const latest = new Map<string, any>();
  for (const document of documents) latest.set(document.document_type_id, document);
  const available = (id: string) => {
    const document = latest.get(id);
    return !!document && !["rejected", "replacement_required"].includes(document.review_status);
  };
  const missing = (rules.document_types || []).filter((x: any) => x.active !== false && x.required && !available(x.id)).map((x: any) => x.name);
  (rules.required_document_groups || []).forEach((group: string[], i: number) => {
    if (!group.some(available)) {
      const labels = (rules.document_types || []).filter((x: any) => group.includes(x.id)).map((x: any) => x.name);
      missing.push(`one of: ${labels.join(", ") || `required evidence group ${i + 1}`}`);
    }
  });
  (rules.additional_requirements || []).forEach((extra: any) => {
    const requested = extra.requested_at ? Date.parse(extra.requested_at) : -Infinity;
    if (!extra.document_type_ids.some((id: string) => available(id) && Date.parse(latest.get(id).uploaded_at) > requested)) missing.push(extra.reason);
  });
  return missing;
}
