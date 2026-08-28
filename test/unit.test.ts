import { EventEmitter }   from "events"
import { readFileSync }   from "fs"
import { join }           from "path"
import { expect }         from "@hapi/code"
import jwt                from "jsonwebtoken"
import PDF                from "../src/lib/PDF"
import CLIReporter        from "../src/reporters/cli"
import {
    assert,
    fhirInstant,
    formatDuration,
    generateProgress,
    getAccessTokenExpiration,
    humanFileSize,
    normalizeDestination,
    wait
} from "../src/lib/utils"


describe("Unit: utils", () => {

    describe("formatDuration", () => {
        it ("renders zero as seconds", () => {
            expect(formatDuration(0)).to.equal("0 seconds")
        })
        it ("renders single units", () => {
            expect(formatDuration(1000)).to.equal("1 second")
            expect(formatDuration(60_000)).to.equal("1 minute")
            expect(formatDuration(3_600_000)).to.equal("1 hour")
            expect(formatDuration(86_400_000)).to.equal("1 day")
            expect(formatDuration(604_800_000)).to.equal("1 week")
        })
        it ("pluralizes and joins with 'and'", () => {
            expect(formatDuration(2000)).to.equal("2 seconds")
            expect(formatDuration(61_000)).to.equal("1 minute and 1 second")
        })
        it ("joins three or more chunks with commas", () => {
            expect(formatDuration(3_661_000)).to.equal("1 hour, 1 minute and 1 second")
        })
    })

    describe("humanFileSize", () => {
        it ("defaults to zero bytes", () => {
            expect(humanFileSize()).to.equal("0.0 B")
        })
        it ("formats bytes without scaling below the base", () => {
            expect(humanFileSize(1000)).to.equal("1000.0 B")
        })
        it ("scales to kB and MB", () => {
            expect(humanFileSize(2048)).to.equal("2.0 kB")
            expect(humanFileSize(3 * 1024 * 1024)).to.equal("3.0 MB")
        })
        it ("uses base 1000 in bits mode", () => {
            expect(humanFileSize(2000, true)).to.equal("2.0 kb")
        })
    })

    describe("assert", () => {
        it ("passes through on truthy condition", () => {
            expect(() => assert(true, "should not throw")).to.not.throw()
        })
        it ("throws the default message", () => {
            expect(() => assert(false)).to.throw(Error, "Assertion failed")
        })
        it ("throws a custom message", () => {
            expect(() => assert(null, "custom message")).to.throw(Error, "custom message")
        })
        it ("throws a custom error constructor", () => {
            class MyError extends Error {}
            expect(() => assert(0, MyError as any)).to.throw(MyError)
        })
    })

    describe("fhirInstant", () => {
        it ("returns empty string for empty input", () => {
            expect(fhirInstant("")).to.equal("")
            expect(fhirInstant(null)).to.equal("")
            expect(fhirInstant(undefined)).to.equal("")
        })
        it ("formats valid dates as instants", () => {
            expect(fhirInstant("2020-01-02T03:04:05Z")).to.match(/^2020-01-0\dT\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
        })
        it ("throws on invalid dates", () => {
            expect(() => fhirInstant("not-a-date")).to.throw(Error, /Invalid fhirInstant/)
        })
    })

    describe("generateProgress", () => {
        it ("renders the given percentage", () => {
            expect(generateProgress(50)).to.contain("50%")
        })
        it ("falls back to 0 for invalid input", () => {
            expect(generateProgress(NaN)).to.contain("0%")
            expect(generateProgress(Infinity)).to.contain("0%")
        })
    })

    describe("getAccessTokenExpiration", () => {
        it ("uses expires_in when present", () => {
            const now = Math.floor(Date.now() / 1000);
            const exp = getAccessTokenExpiration({ expires_in: 100, access_token: "x" } as any);
            expect(Math.abs(exp - (now + 100))).to.be.below(5)
        })
        it ("falls back to the JWT exp claim", () => {
            const exp = Math.floor(Date.now() / 1000) + 555;
            const token = jwt.sign({ exp }, "secret");
            expect(getAccessTokenExpiration({ access_token: token } as any)).to.equal(exp)
        })
        it ("defaults to 20 minutes from now", () => {
            const now = Math.floor(Date.now() / 1000);
            const exp = getAccessTokenExpiration({} as any);
            expect(Math.abs(exp - (now + 1200))).to.be.below(5)
        })
    })

    describe("wait", () => {
        it ("resolves after the timeout", async () => {
            await wait(10)
        })
        it ("rejects when aborted", async () => {
            const ctl = new AbortController();
            const p = wait(10_000, ctl.signal);
            ctl.abort();
            await expect(p).to.reject()
        })
    })

    describe("normalizeDestination", () => {
        it ("returns empty string for none", () => {
            expect(normalizeDestination("")).to.equal("")
            expect(normalizeDestination("none")).to.equal("")
            expect(normalizeDestination(undefined)).to.equal("")
        })
        it ("returns non-file URLs as-is", () => {
            expect(normalizeDestination("http://example.com/x")).to.equal("http://example.com/x")
            expect(normalizeDestination("s3://bucket/folder")).to.equal("s3://bucket/folder")
        })
        it ("resolves existing local directories to absolute paths", () => {
            const dir = join(__dirname, "tmp/downloads");
            expect(normalizeDestination(dir)).to.equal(dir)
        })
        it ("throws for local paths that are not directories", () => {
            expect(() => normalizeDestination(join(__dirname, "does/not/exist"))).to.throw()
        })
    })
})

describe("Unit: PDF", () => {
    it ("extracts text from a PDF", async () => {
        const data = readFileSync(join(__dirname, "fixtures/sample.pdf"));
        const text = await PDF.getPDFText({ data });
        expect(text).to.contain("Hello Bulk Data")
    })
})

describe("Unit: CLI reporter", () => {

    function fakeClient(options: any = {}) {
        const client = new EventEmitter() as any;
        client.options = options;
        return client
    }

    function fakeDownload(overrides: any = {}) {
        return {
            downloadedBytes  : 100,
            uncompressedBytes: 100,
            resources        : 1,
            attachments      : 0,
            completed        : true,
            ...overrides
        }
    }

    it ("handles the full event lifecycle and detaches", () => {
        const client = fakeClient();
        const reporter = CLIReporter(client);

        client.emit("authorize")
        client.emit("kickOffStart")
        client.emit("kickOffEnd")
        client.emit("exportStart", { message: "started", statusEndpoint: "http://status" })
        client.emit("exportProgress", { message: "working", statusEndpoint: "http://status" })
        client.emit("exportPage", {}, "http://next")
        client.emit("downloadStart")
        client.emit("downloadProgress", [fakeDownload(), fakeDownload({ completed: false })])
        client.emit("allDownloadsComplete")

        reporter.detach()

        // After detach nothing should be listening
        expect(client.listenerCount("downloadProgress")).to.equal(0)
        expect(client.listenerCount("authorize")).to.equal(0)
    })

    it ("reports compression ratio when sizes differ and flags skipped attachments", () => {
        const client = fakeClient({ downloadAttachments: false });
        const reporter = CLIReporter(client);
        client.emit("downloadStart")
        client.emit("downloadProgress", [fakeDownload({ uncompressedBytes: 1000, attachments: 2 })])
        client.emit("allDownloadsComplete")
        reporter.detach()
    })

    it ("forwards errors to console.error", () => {
        const client = fakeClient();
        const reporter = CLIReporter(client);
        const original = console.error;
        let seen: any = null;
        console.error = (e: any) => { seen = e };
        try {
            client.emit("error", new Error("boom"))
        } finally {
            console.error = original;
            reporter.detach()
        }
        expect(seen).to.be.an.error("boom")
    })
})
