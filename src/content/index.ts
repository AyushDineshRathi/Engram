import type { FormField } from "../types/form";
import { extractFormFields, resetExtractionCache } from "./extractFields";

const FRAME_SCOPE = window.top === window ? "top-frame" : "child-frame";
console.log(`Engram content script loaded (${FRAME_SCOPE})`);

const RELEVANT_MUTATION_SELECTOR = [
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "button[type='submit']",
  "input[type='submit']",
  "form",
  "[role='form']",
].join(",");

const EXTRACTION_DEBOUNCE_MS = 150;
const MIN_STABLE_FIELDS = 3;
const REQUIRED_STABLE_PASSES = 2;

let observer: MutationObserver | null = null;
let debounceTimer: number | null = null;
let emittedSignature: string | null = null;
let stableSignature: string | null = null;
let stablePasses = 0;
let detectionFinalized = false;

function buildFieldsSignature(fields: FormField[]): string {
  return fields
    .map((field) => `${field.selector}|${field.type}|${field.required ? "1" : "0"}`)
    .sort()
    .join("||");
}

function isStableExtraction(fields: FormField[]): boolean {
  if (fields.length < MIN_STABLE_FIELDS) return false;
  return fields.some(
    (field) => field.type === "Text" || field.type === "Textarea" || field.type === "Select"
  );
}

function runExtraction() {
  if (detectionFinalized) return;

  const fields = extractFormFields();
  const signature = buildFieldsSignature(fields);

  if (signature !== emittedSignature) {
    emittedSignature = signature;

    if (fields.length > 0) {
      console.log("Detected fields:", fields);
    } else {
      console.log("No fields detected yet.");
    }
  }

  if (!isStableExtraction(fields)) {
    stableSignature = null;
    stablePasses = 0;
    return;
  }

  if (signature === stableSignature) {
    stablePasses += 1;
  } else {
    stableSignature = signature;
    stablePasses = 1;
  }

  if (stablePasses >= REQUIRED_STABLE_PASSES) {
    detectionFinalized = true;
    stopObserver();
  }
}

function nodeContainsRelevantControl(node: Node): boolean {
  if (!(node instanceof Element)) return false;
  if (node.matches(RELEVANT_MUTATION_SELECTOR)) return true;
  return !!node.querySelector(RELEVANT_MUTATION_SELECTOR);
}

function hasRelevantMutation(mutations: MutationRecord[]): boolean {
  for (const mutation of mutations) {
    if (nodeContainsRelevantControl(mutation.target)) return true;

    for (const node of mutation.addedNodes) {
      if (nodeContainsRelevantControl(node)) return true;
    }

    for (const node of mutation.removedNodes) {
      if (nodeContainsRelevantControl(node)) return true;
    }
  }

  return false;
}

function scheduleExtraction(): void {
  if (detectionFinalized) return;

  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
  }

  debounceTimer = window.setTimeout(() => {
    debounceTimer = null;
    runExtraction();
  }, EXTRACTION_DEBOUNCE_MS);
}

function startObserver(): void {
  if (observer || detectionFinalized) return;
  if (!document.body) return;

  observer = new MutationObserver((mutations) => {
    if (!hasRelevantMutation(mutations)) return;
    scheduleExtraction();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function stopObserver(): void {
  if (!observer) return;
  observer.disconnect();
  observer = null;
}

function resetDetectionState(): void {
  detectionFinalized = false;
  emittedSignature = null;
  stableSignature = null;
  stablePasses = 0;
  resetExtractionCache();

  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

function onNavigationChange(): void {
  resetDetectionState();
  startObserver();
  scheduleExtraction();
}

function patchHistory(): void {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args: Parameters<History["pushState"]>): void {
    const result = originalPushState.apply(this, args);
    onNavigationChange();
    return result;
  };

  history.replaceState = function (...args: Parameters<History["replaceState"]>): void {
    const result = originalReplaceState.apply(this, args);
    onNavigationChange();
    return result;
  };

  window.addEventListener("popstate", onNavigationChange);
}

patchHistory();
function boot(): void {
  runExtraction();
  if (document.body) {
    startObserver();
    return;
  }

  window.addEventListener(
    "DOMContentLoaded",
    () => {
      startObserver();
      scheduleExtraction();
    },
    { once: true }
  );
}

boot();