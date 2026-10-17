export type TreeAnswer = { id: string; tree: string; city: string; place: string; story: string; name: string };
export type TreeSubmission = TreeAnswer & { consent: true };
export function parseTreeSubmission(value: unknown): TreeSubmission {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Please complete the questionnaire.");
  const body = value as Record<string, unknown>;
  const read = (key: string, max: number, required = false) => {
    if (typeof body[key] !== "string") throw new Error(`Please check the ${key} field.`);
    const text = (body[key] as string).trim();
    if (text.length > max || (required && !text)) throw new Error(`Please check the ${key} field (maximum ${max} characters).`);
    return text;
  };
  const id = read("id", 36, true);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new Error("Please refresh the page and try again.");
  if (body.consent !== true) throw new Error("Please give permission to display your response.");
  return { id, tree: read("tree", 100, true), city: read("city", 100, true), place: read("place", 160), story: read("story", 500, true), name: read("name", 80), consent: true };
}
