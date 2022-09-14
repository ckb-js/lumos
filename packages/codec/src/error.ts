export const CODEC_OPTIONAL_PATH = "______?______";
type CodecOptionalPath = typeof CODEC_OPTIONAL_PATH;
export class CodecBaseParseError extends Error {
  constructor(message: string, public expectedType: string) {
    super(message);
  }
}

const CODEC_EXECUTE_ERROR_NAME = "CodecExecuteError";
export function isCodecExecuteError(
  error: unknown
): error is CodecExecuteError {
  return (error as Error)?.name === CODEC_EXECUTE_ERROR_NAME;
}

/**
 * This method can collect CodecBaseParseError, and put an human-readable error
 */
export class CodecExecuteError extends Error {
  name = CODEC_EXECUTE_ERROR_NAME;
  constructor(private origin: CodecBaseParseError) {
    super();
  }

  keys: (number | string | CodecOptionalPath)[] = [];

  public updateKey(key: number | string | symbol): void {
    this.keys.push(key as number | string);
    this.message = this.getPackErrorMessage();
  }

  private getPackErrorMessage(): string {
    type CodecPath = number | string | CodecOptionalPath;

    const reducer = (acc: string, cur: CodecPath, index: number) => {
      if (cur === CODEC_OPTIONAL_PATH) {
        cur = index === 0 ? "?" : "?.";
      } else if (typeof cur === "number") {
        cur = `[${cur}]`;
      } else {
        cur = `.${cur}`;
      }
      return acc + cur;
    };

    const path = this.keys.reduceRight(reducer, "input");

    return `Expect type ${this.origin.expectedType} at ${path} but got error: ${
      this.origin.message
    }
    ${this.origin.stack?.replace(/Error:.+?\n/, "")}
    `;
  }
}
