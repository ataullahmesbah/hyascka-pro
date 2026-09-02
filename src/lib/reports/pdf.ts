/**
 * A minimal, dependency-free PDF writer for tabular reports (PRD §6.3).
 *
 * Uses only the standard Helvetica faces, which every reader has built in, so
 * there is no font to embed and no rendering library in the deployment. Enough
 * for a finance or delivery report; not a typesetting engine.
 */
export type PdfTable = { title: string; headers: string[]; rows: string[][] };
export type PdfDoc = {
  title: string;
  subtitle?: string;
  meta?: string[];
  tables: PdfTable[];
};

const PAGE_W = 842; // A4 landscape — reports are wide
const PAGE_H = 595;
const MARGIN = 36;
const LINE = 13;

/** Widths for Helvetica at size 1, used to fit and ellipsise cell text. */
const WIDTHS: Record<string, number> = {};
for (let i = 32; i < 127; i += 1) {
  const c = String.fromCharCode(i);
  WIDTHS[c] = "iljI.,:;'|!".includes(c)
    ? 0.28
    : "frt()[]{}/\\-".includes(c)
      ? 0.35
      : "MW@%".includes(c)
        ? 0.85
        : c === c.toUpperCase() && /[A-Z]/.test(c)
          ? 0.68
          : 0.53;
}

function textWidth(text: string, size: number) {
  let total = 0;
  for (const char of text) total += WIDTHS[char] ?? 0.55;
  return total * size;
}

function fit(text: string, size: number, maxWidth: number) {
  if (textWidth(text, size) <= maxWidth) return text;
  let out = "";
  for (const char of text) {
    if (textWidth(`${out}${char}…`, size) > maxWidth) break;
    out += char;
  }
  return `${out}…`;
}

/** PDF strings escape backslash and both parentheses; non-Latin-1 is dropped. */
function pdfString(text: string) {
  return text
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function buildPdf(doc: PdfDoc): Buffer {
  const pages: string[] = [];
  let ops: string[] = [];
  let y = 0;

  const newPage = () => {
    if (ops.length) pages.push(ops.join("\n"));
    ops = [];
    y = PAGE_H - MARGIN;
  };

  const text = (value: string, x: number, size: number, font: "F1" | "F2", grey = 0) => {
    ops.push(
      `BT /${font} ${size} Tf ${grey} ${grey} ${grey} rg 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${pdfString(value)}) Tj ET`,
    );
  };

  const rule = (grey = 0.82) => {
    ops.push(
      `${grey} ${grey} ${grey} RG 0.6 w ${MARGIN} ${y.toFixed(1)} m ${(PAGE_W - MARGIN).toFixed(1)} ${y.toFixed(1)} l S`,
    );
  };

  newPage();

  // ---- Cover block ----
  text(doc.title, MARGIN, 20, "F2");
  y -= 20;
  if (doc.subtitle) {
    text(doc.subtitle, MARGIN, 10.5, "F1", 0.35);
    y -= 16;
  }
  for (const line of doc.meta ?? []) {
    text(line, MARGIN, 9, "F1", 0.45);
    y -= 12;
  }
  y -= 6;
  rule(0.75);
  y -= 20;

  // ---- Tables ----
  for (const table of doc.tables) {
    if (y < MARGIN + 90) newPage();

    text(table.title, MARGIN, 12.5, "F2");
    y -= 18;

    const usable = PAGE_W - MARGIN * 2;
    // Column widths follow the longest content, clamped so no column dominates.
    const weights = table.headers.map((header, index) => {
      const longest = Math.max(
        header.length,
        ...table.rows.slice(0, 60).map((row) => (row[index] ?? "").length),
      );
      return Math.min(34, Math.max(7, longest));
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
    const widths = weights.map((weight) => (weight / totalWeight) * usable);
    const xs = widths.reduce<number[]>((acc, width, index) => {
      acc.push(index === 0 ? MARGIN : acc[index - 1] + widths[index - 1]);
      return acc;
    }, []);

    const drawHeader = () => {
      table.headers.forEach((header, index) => {
        text(fit(header, 8.5, widths[index] - 6), xs[index], 8.5, "F2", 0.25);
      });
      y -= 6;
      rule(0.85);
      y -= LINE;
    };
    drawHeader();

    if (!table.rows.length) {
      text("No records in this period.", MARGIN, 9, "F1", 0.5);
      y -= LINE * 2;
      continue;
    }

    for (const row of table.rows) {
      if (y < MARGIN + 30) {
        newPage();
        text(`${table.title} (continued)`, MARGIN, 12.5, "F2");
        y -= 18;
        drawHeader();
      }
      row.forEach((cell, index) => {
        text(fit(cell ?? "", 8.5, widths[index] - 6), xs[index], 8.5, "F1", 0.15);
      });
      y -= LINE;
    }
    y -= 16;
  }

  newPage();

  // ---- Assemble the file ----
  const objects: string[] = [];
  const pageCount = pages.length;
  const kids = pages.map((_, index) => `${4 + index * 2} 0 R`).join(" ");

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [${kids}] >>`;
  objects[3] =
    "<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> " +
    "/F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> >> >>";

  pages.forEach((content, index) => {
    const pageObj = 4 + index * 2;
    const streamObj = pageObj + 1;
    objects[pageObj] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources 3 0 R /Contents ${streamObj} 0 R >>`;
    objects[streamObj] = `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`;
  });

  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i += 1) {
    if (!objects[i]) continue;
    offsets[i] = Buffer.byteLength(out, "latin1");
    out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(out, "latin1");
  const maxObj = objects.length;
  out += `xref\n0 ${maxObj}\n0000000000 65535 f \n`;
  for (let i = 1; i < maxObj; i += 1) {
    out += offsets[i]
      ? `${String(offsets[i]).padStart(10, "0")} 00000 n \n`
      : "0000000000 65535 f \n";
  }
  out += `trailer\n<< /Size ${maxObj} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(out, "latin1");
}
