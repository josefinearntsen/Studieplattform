// pdf-parse's package root (index.js) has a debug-mode check that breaks under
// webpack bundling — see the comment in src/lib/documents.ts. We import the
// underlying implementation directly instead, which ships no types of its own.
declare module 'pdf-parse/lib/pdf-parse.js' {
  function PdfParse(
    dataBuffer: Buffer,
    options?: { pagerender?: (pageData: any) => string | Promise<string>; max?: number; version?: string }
  ): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }>;
  export = PdfParse;
}
