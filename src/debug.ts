import util from "util";
import { createWriteStream, type WriteStream } from "fs";

const defaultLogFileName = 'vpss.md';
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
export async function writeToLog(formatString: string, ...restArgs: any[]) {
    let data: string;
    if (restArgs?.length > 0) {
        data = formatData(formatString, restArgs);
    }
    else {
        data = formatString;
    }
    return new Promise<void>((rslv, rjct) => {
        if (!stream) {
            rslv();
            return;
        }
        stream.write(data, (error) => {
            if (error) {
                rjct(error);
            }
            else {
                rslv();
            }
        });
    });
}

/**
 * Outputs data according to the desired format string.
 * @param formatString Desired format string.
 * @param restArgs Arguments used to fill the placeholders found in the format string.
 * @returns The result of combining the arguments as specified by the format string.
 */
export function formatData(formatString: string, ...restArgs: any[]) {
    return util.format(`${formatString}\n`, ...restArgs);
}

/**
 * Creates a Markdown code block around the provided content.
 * @param content Code block content.
 * @param lang Code block language.  If not specified, it will be 'js' by default.
 * @returns A string containing the desired Markdown code block.
 */
export function markdownCodeBlock(content: string, lang: 'js' | 'ts' | 'html' | 'plaintext' = 'js') {
    return formatData("```%s\n%s\n```\n\n", lang, content);
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
