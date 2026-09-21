/**
 * How a user's role is shown in the UI.
 *
 * The role stored on the user is `agent` — it drives authorisation, the API and
 * the database, and renaming it would be a migration. But nobody in the product
 * is called an agent any more: they are Partners, everywhere from the signup
 * page to the emails to the portal itself. Rendering `user.role` directly meant
 * a partner logged in and saw "Agent" next to their own name.
 *
 * So this maps the stored value to the word we actually use. Display only —
 * never compare against the result, always against `user.role`.
 */
const ROLE_LABELS: Record<string, string> = {
  agent: 'Partner',
  admin: 'Admin',
  pt_admin: 'PlanetTalk Admin',
}

export function roleLabel(role?: string | null): string {
  if (!role) return ''
  return ROLE_LABELS[role] ?? role.replace(/_/g, ' ')
}
