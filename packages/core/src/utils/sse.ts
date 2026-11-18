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

/**
 * The most a stream may send without an event boundary. Events are a few kilobytes; a server or
 * gateway that never ends one would otherwise grow the buffer until the process runs out of memory.
 */
export const MAX_SSE_BUFFER_CHARS = 8 * 1024 * 1024;

/**
 * Adds a read to the unsplit part of the stream, with line endings made LF. Only the new read (and a
 * "\r" left waiting from the last one) is normalized, so a long event costs one pass, not one pass
 * per read. Throws when the stream sends more than MAX_SSE_BUFFER_CHARS without an event boundary.
 */
export function appendSseChunk(
  buffer: string,
  chunk: string,
  maxChars: number = MAX_SSE_BUFFER_CHARS
): string {
  const waiting = buffer.endsWith("\r");
  const kept = waiting ? buffer.slice(0, -1) : buffer;
  const next = kept + normalizeSseBuffer((waiting ? "\r" : "") + chunk);
  if (next.length > maxChars) {
    throw new Error(
      `The stream sent more than ${maxChars} characters without an event boundary, so it was stopped`
    );
  }
  return next;
}
