import { Transform } from "stream"


export interface ParseNDJSONOptions {
    maxLineLength: number,
    expectedResourceType?: string
    expectedCount: number
}


/**
 * This is a transform stream that takes parts of NDJSON file as Buffer chunks
 * and emits one JSON object for each non-empty line
 */
export default class ParseNDJSON extends Transform
{
    /**
     * Cache the string contents that we have read so far until we reach a
     * new line
     */
    private _stringBuffer: string = "";

    /**
     * The buffer size as number of utf8 characters
     */
    private bufferSize = 0;

    /**
     * Line counter
     */
    private _line = 0;

    /**
     * Object (resource) counter
     */
    private _count = 0;

    private _headersCount = 0;

    private options: ParseNDJSONOptions = {
        maxLineLength: 1000000,
        expectedResourceType: "",
        expectedCount: -1
    }

    constructor(options?: ParseNDJSONOptions)
    {
        super({
            writableObjectMode: true,
            readableObjectMode: true
        });

        Object.assign(this.options, options || {})
    }

    get count()
    {
        return this._line;
    }

    override _transform(chunk: Buffer, encoding: any, next: (err?: Error) => any)
    {
        // Convert the chunk buffer to string
        const stringChunk = chunk.toString("utf8");

        // Get the char length of the chunk
        const chunkLength = stringChunk.length;

        // Check if concatenating this chunk to the buffer will result in buffer
        // overflow. Protect against very long lines (possibly bad files without
        // EOLs).
        if (this.bufferSize + chunkLength > this.options.maxLineLength) {
            this._stringBuffer = "";
            this.bufferSize   = 0;
            return next(new Error(
                `Buffer overflow. No EOL found in ${this.options.maxLineLength
                } subsequent characters.`
            ));
        }

        // Append to buffer
        this._stringBuffer += stringChunk;
        this.bufferSize = this._stringBuffer.length;

        
        // Find the position of the first EOL
        let eolPos = this._stringBuffer.search(/\n/);

        // The chunk might span over multiple lines
        while (eolPos > -1) {
            const jsonString   = this._stringBuffer.substring(0, eolPos);
            this._stringBuffer = this._stringBuffer.substring(eolPos + 1);
            this.bufferSize    = this._stringBuffer.length;
            this._line        += 1;
            
            // If this is not an empty line!
            if (jsonString.trim().length) {
                try {
                    this.processLine(jsonString)
                } catch (error) {
                    return next(error as Error)
                }
            }

            eolPos = this._stringBuffer.search(/\n/);
        }

        next();
    }

    /**
     * After we have consumed and transformed the entire input, the buffer may
     * still contain the last line so make sure we handle that as well
     * @param {function} next 
     */
    override _final(next: (err?: Error) => any)
    {
        if (this._stringBuffer) {
            this._line += 1
            try {
                this.processLine(this._stringBuffer)
            } catch (error) {
                return next(error as Error)
            }
        }
        
        const resourceCount = this._count - this._headersCount
        if (this.options.expectedCount > -1 && resourceCount !== this.options.expectedCount) {
            return next(new Error(`Expected ${this.options.expectedCount} resources but found ${resourceCount}`))
        }
        
        next()
    }

    processLine(line: string) {
        try {
            const json = JSON.parse(line);

            if (json.resourceType === "Parameters") {
                this._headersCount += 1
            }

            else if (this.options.expectedResourceType &&
                json.resourceType !== this.options.expectedResourceType) {
                throw new Error(`Expected each resource to have a "${
                    this.options.expectedResourceType
                }" resourceType but found "${json.resourceType}"`)
            }

            this.push(json);
            this._count += 1;
        } catch (error) {
            this._stringBuffer = "";
            this.bufferSize    = 0;
            throw new SyntaxError(
                `Error parsing NDJSON on line ${this._line}: ${error}`
            );
        }
    }
}

