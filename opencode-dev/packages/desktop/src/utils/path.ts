export function getFilename(path: string) {
  if (!path) return ""
  const trimmed = path.replace(/[\/]+$/, "")
  const parts = trimmed.split("/")
  return parts[parts.length - 1] ?? ""
}

export function getDirectory(path: string) {
  const parts = path.split("/")
  return parts.slice(0, parts.length - 1).join("/")
}

export function getFileExtension(path: string) {
  const parts = path.split(".")
  return parts[parts.length - 1]
}
