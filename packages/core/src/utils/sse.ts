/**
 * Server-sent events may end lines with CRLF, LF or CR, so an event boundary can be "\r\n\r\n" as
 * well as "\n\n". Streams split events on "\n\n", so line endings are made LF first.
 *
 * A trailing "\r" is kept as it is: its "\n" may arrive in the next read, and turning it into "\n"
 * now would make one line ending into two.
 */
export function normalizeSseBuffer(buffer: string): string {
  const tail = buffer.endsWith("\r") ? "\r" : "";
  const body = tail ? buffer.slice(0, -1) : buffer;
  return body.replace(/\r\n?/g, "\n") + tail;
}
