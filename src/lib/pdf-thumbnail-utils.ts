import type { PdfDocumentObject, PdfEngine } from "@embedpdf/models"

const PDFIUM_VERSION = "2.15.1"
const PDFIUM_CDN_WASM_URL = `https://cdn.jsdelivr.net/npm/@embedpdf/pdfium@${PDFIUM_VERSION}/dist/pdfium.wasm`

let sharedEnginePromise: Promise<PdfEngine> | null = null
const pdfDocumentCache = new Map<string, Promise<PdfDocumentObject>>()
const thumbnailUrlCache = new Map<string, Promise<string | null>>()

export function loadSharedPdfEngine(): Promise<PdfEngine> {
  if (sharedEnginePromise) return sharedEnginePromise

  sharedEnginePromise = (async () => {
    const localWasmUrl =
      typeof window !== "undefined" && window.location
        ? new URL("/pdfium.wasm", window.location.href).href
        : "/pdfium.wasm"

    try {
      const { createPdfiumEngine: createDirectEngine } = await import(
        "@embedpdf/engines/pdfium-direct-engine"
      )
      return await createDirectEngine(localWasmUrl, {})
    } catch (directErr) {
      console.warn("Direct engine failed with local wasm, trying CDN:", directErr)
      try {
        const { createPdfiumEngine: createDirectEngine } = await import(
          "@embedpdf/engines/pdfium-direct-engine"
        )
        return await createDirectEngine(PDFIUM_CDN_WASM_URL, {})
      } catch (cdnErr) {
        console.warn("Direct engine CDN failed, trying worker engine fallback:", cdnErr)
        const { createPdfiumEngine: createWorkerEngine } = await import(
          "@embedpdf/engines/pdfium-worker-engine"
        )
        return await createWorkerEngine(localWasmUrl, {})
      }
    }
  })().catch((err) => {
    sharedEnginePromise = null
    throw err
  })

  return sharedEnginePromise
}

export async function loadPdfDocument(url: string) {
  let documentPromise = pdfDocumentCache.get(url)

  if (!documentPromise) {
    documentPromise = loadSharedPdfEngine().then(async (engine) => {
      if (url.startsWith("blob:")) {
        const res = await fetch(url)
        const arrayBuf = await res.arrayBuffer()
        return engine
          .openDocumentBuffer(
            { id: url, content: arrayBuf },
            {}
          )
          .toPromise()
      }
      return engine
        .openDocumentUrl(
          { id: url, url },
          { mode: "auto" }
        )
        .toPromise()
    })
    pdfDocumentCache.set(url, documentPromise)
  }

  return documentPromise
}

export async function getPdfPageCount(url: string) {
  return (await loadPdfDocument(url)).pageCount
}

export function renderPdfThumbnailUrl({
  dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
  pageIndex,
  url,
  width,
}: {
  dpr?: number
  pageIndex: number
  url: string
  width: number
}) {
  const cacheKey = `${url}#${pageIndex}@${width}x${dpr}`
  let thumbnailPromise = thumbnailUrlCache.get(cacheKey)

  if (!thumbnailPromise) {
    thumbnailPromise = (async () => {
      const [engine, document] = await Promise.all([
        loadSharedPdfEngine(),
        loadPdfDocument(url),
      ])
      const page = document.pages[pageIndex]

      if (!page) return null

      const blob = await engine
        .renderThumbnail(document, page, {
          dpr,
          imageType: "image/png",
          scaleFactor: width / page.size.width,
          withAnnotations: true,
        })
        .toPromise()

      return URL.createObjectURL(blob)
    })()
    thumbnailUrlCache.set(cacheKey, thumbnailPromise)
  }

  return thumbnailPromise
}
