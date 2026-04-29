const configUrl = "/config.json";

const titleElement = document.getElementById("page-title");
const subtitleElement = document.getElementById("page-subtitle");
const selectorElement = document.getElementById("doc-selector");
const feedbackElement = document.getElementById("feedback");
const containerElement = document.getElementById("asyncapi-container");
const currentDocNameElement = document.getElementById("current-doc-name");
const currentDocDescriptionElement = document.getElementById("current-doc-description");
const currentDocFileElement = document.getElementById("current-doc-file");

const asyncApiConfig = {
  show: {
    sidebar: false
  }
};

let runtimeConfig = null;

function setFeedback(message, type = "info") {
  feedbackElement.textContent = message;
  feedbackElement.dataset.state = type;
  feedbackElement.hidden = !message;
}

function getRequestedDocId() {
  const url = new URL(window.location.href);
  return url.searchParams.get("doc");
}

function updateUrl(docId) {
  const url = new URL(window.location.href);
  url.searchParams.set("doc", docId);
  window.history.replaceState({}, "", url);
}

function findDocument(docId) {
  return runtimeConfig.documents.find((documentItem) => documentItem.id === docId);
}

function resolveInitialDocument() {
  const requestedDocId = getRequestedDocId();
  const requestedDocument = requestedDocId ? findDocument(requestedDocId) : null;
  if (requestedDocument) {
    return requestedDocument;
  }

  if (runtimeConfig.primaryName) {
    const primaryDocument = runtimeConfig.documents.find(
      (documentItem) => documentItem.label === runtimeConfig.primaryName
    );
    if (primaryDocument) {
      return primaryDocument;
    }
  }

  return runtimeConfig.documents[0];
}

function buildRawDocumentUrl(documentItem) {
  const sourceUrl = new URL(documentItem.url, window.location.origin);
  if (sourceUrl.origin !== window.location.origin) {
    return sourceUrl.toString();
  }

  if (!sourceUrl.pathname.startsWith("/docs/")) {
    return sourceUrl.toString();
  }

  const rawUrl = new URL(sourceUrl.toString());
  rawUrl.pathname = `/raw/${sourceUrl.pathname.slice("/docs/".length)}`;
  rawUrl.search = "";
  rawUrl.hash = "";
  return rawUrl.toString();
}

function setRawDocumentMeta(documentItem) {
  currentDocFileElement.href = buildRawDocumentUrl(documentItem);
  currentDocFileElement.title = `Open raw document: ${currentDocFileElement.href}`;
}

function setCurrentDocMeta(documentItem) {
  currentDocNameElement.textContent = documentItem.label;
  currentDocDescriptionElement.textContent = documentItem.description || "";
  currentDocDescriptionElement.hidden = !documentItem.description;
  currentDocFileElement.textContent = documentItem.url;
  setRawDocumentMeta(documentItem);
  document.title = `${documentItem.label} | ${runtimeConfig.title}`;
}

function buildRenderRoot() {
  const renderRoot = document.createElement("div");
  renderRoot.className = "asyncapi-render-root";
  containerElement.replaceChildren(renderRoot);
  return renderRoot;
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.text();
}

async function renderDocument(documentItem) {
  selectorElement.value = documentItem.id;
  setCurrentDocMeta(documentItem);
  setFeedback(`Loading ${documentItem.label}...`);

  const schema = await fetchText(documentItem.url);
  const renderRoot = buildRenderRoot();

  if (!window.AsyncApiStandalone || typeof window.AsyncApiStandalone.render !== "function") {
    throw new Error("AsyncApiStandalone bundle was not loaded.");
  }

  window.AsyncApiStandalone.render(
    {
      schema,
      config: asyncApiConfig
    },
    renderRoot
  );

  updateUrl(documentItem.id);
  setFeedback("");
}

async function onDocumentChange(event) {
  const selectedDocument = findDocument(event.target.value);
  if (!selectedDocument) {
    return;
  }

  try {
    await renderDocument(selectedDocument);
  } catch (error) {
    setFeedback(`Failed to render document: ${error.message}`, "error");
  }
}

function populateSelector(documents) {
  selectorElement.replaceChildren(
    ...documents.map((documentItem) => {
      const option = document.createElement("option");
      option.value = documentItem.id;
      option.textContent = documentItem.label;
      return option;
    })
  );
}

async function bootstrap() {
  try {
    setFeedback("Loading document registry...");
    runtimeConfig = await fetchJson(configUrl);

    if (!Array.isArray(runtimeConfig.documents) || runtimeConfig.documents.length === 0) {
      throw new Error(runtimeConfig.error || "No documents were configured.");
    }

    titleElement.textContent = runtimeConfig.title || "Project Docs";
    subtitleElement.textContent = runtimeConfig.subtitle || "Pure preview service";
    populateSelector(runtimeConfig.documents);
    selectorElement.addEventListener("change", onDocumentChange);

    const initialDocument = resolveInitialDocument();
    await renderDocument(initialDocument);
  } catch (error) {
    setFeedback(error.message, "error");
  }
}

bootstrap();
