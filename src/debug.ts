import util from "util";
import { createWriteStream, type WriteStream } from "fs";

const defaultLogFileName = 'vpss.log';
let stream: WriteStream | undefined;

/**
 * Opens the vite-plugin-single-spa log file for writing.  If the file doesn't exist then it gets created; if the file 
 * exists, it is truncated.
 */
export function openLog(fileName: string | undefined) {
    stream = createWriteStream(fileName ?? defaultLogFileName, 'utf-8');
}

/**
 * Composes the message by merging the format string with the arguments and writes the result to the log file.
 * 
 * Note that a call to `openLog()` is required.  Failing to do this will not result in an error, but will result in 
 * the lack of content in the log file.
 * @param formatString Message's format string.
 * @param restArgs Arguments used to fill the placeholders found in the format string.
 */
export function writeToLog(formatString: string, ...restArgs: any[]) {
    if (!stream) {
        return;
    }
    const data = util.format(`${formatString}\n`, ...restArgs);
    stream.write(data);
}

/**
 * Closes the vite-plugin-single-spa log file.
 */
export function closeLog() {
    return new Promise<void>((rslv, _rjct) => {
        if (!stream) {
            rslv();
        }
        stream?.end(() => {
            rslv();
            stream = undefined;
        });
    });
}
