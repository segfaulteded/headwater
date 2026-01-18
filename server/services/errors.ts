export class VersionMismatch extends Error {
  constructor(intended: string, found: string){
    super(`Version mismatch: intended: ${intended}, found: ${found}`)
  }
}
