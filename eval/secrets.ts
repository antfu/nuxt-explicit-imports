import process from 'node:process'

/** Env vars that look like credentials: their values must never reach a stored run. */
function secretEntries(env: NodeJS.ProcessEnv = process.env): [string, string][] {
  return Object.entries(env)
    .filter((entry): entry is [string, string] => !!entry[1] && entry[1].length >= 8 && /KEY|TOKEN|SECRET|PASSWORD|AUTH/i.test(entry[0]))
    .sort((a, b) => b[1].length - a[1].length)
}

/** Replace every secret env value in `text` with `<redacted:NAME>`. An agent can print them, for example with `env`. */
export function redact(text: string): string {
  let out = text
  for (const [name, value] of secretEntries())
    out = out.replaceAll(value, `<redacted:${name}>`)
  return out
}

/** `env` without the secret-looking vars, for a harness that gets its key another way. */
export function withoutSecrets(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const out = { ...env }
  for (const [name] of secretEntries(env))
    delete out[name]
  return out
}
