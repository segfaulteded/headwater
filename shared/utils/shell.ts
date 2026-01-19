export function shellSanitize(input: string) {
  return input.replaceAll("\"", "\\\"")
}
