import type { FormField } from "../types/form";

type FormControl =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLElement;

interface CandidateStats {
  container: HTMLElement;
  logicalFieldCount: number;
  textLikeFieldCount: number;
  hasSubmitControl: boolean;
  isFormSemantic: boolean;
  isExcludedRegion: boolean;
  visibleArea: number;
  domIndex: number;
}

interface CandidateAccumulator {
  logicalKeys: Set<string>;
  textLikeKeys: Set<string>;
  domIndex: number;
}

const DISALLOWED_INPUT_TYPES = new Set([
  "hidden",
  "submit",
  "button",
  "reset",
  "image",
]);

const EXCLUDED_REGION_SELECTOR = [
  "header",
  "nav",
  "footer",
  "aside",
  "[role='search']",
  "[aria-label*='cookie' i]",
  "[id*='cookie' i]",
  "[class*='cookie' i]",
  "[id*='consent' i]",
  "[class*='consent' i]",
].join(",");

const MIN_LOGICAL_FIELDS = 3;
const RELAXED_MIN_LOGICAL_FIELDS = 1;
const MAX_ANCESTOR_DEPTH = 8;
const REQUIRED_TRUE_VALUES = new Set(["true", "1", "required"]);

let cachedPrimaryContainer: HTMLElement | null = null;
let cachedPrimaryContainerKey: string | null = null;

export function resetExtractionCache(): void {
  cachedPrimaryContainer = null;
  cachedPrimaryContainerKey = null;
}

export function extractFormFields(): FormField[] {
  const container = getPrimaryFormContainer(document);
  if (!container) return [];

  const filtered = queryEligibleControls(container);

  return filtered.map((el, index) => {
    const placeholder =
      "placeholder" in el && typeof el.placeholder === "string" && el.placeholder.length > 0
        ? el.placeholder
        : undefined;

    return {
      id: generateStableId(el, index),
      type: mapFieldType(el),
      label: extractLabel(el),
      ...(placeholder && { placeholder }),
      contextText: extractContextText(el),
      required: isRequiredField(el),
      selector: generateSelector(el),
    };
  });
}

function getPrimaryFormContainer(root: Document): HTMLElement | null {
  if (cachedPrimaryContainer && isValidPrimaryContainer(cachedPrimaryContainer)) {
    return cachedPrimaryContainer;
  }

  const controls = queryEligibleControls(root);
  if (controls.length === 0) {
    cachedPrimaryContainer = null;
    cachedPrimaryContainerKey = null;
    return null;
  }

  const candidateInfo = collectCandidateContainers(controls);
  if (candidateInfo.size === 0) {
    cachedPrimaryContainer = null;
    cachedPrimaryContainerKey = null;
    return null;
  }

  const allStats = buildCandidateStatsFromControls(candidateInfo);
  const stats = allStats.filter((entry) => entry.logicalFieldCount >= MIN_LOGICAL_FIELDS);

  if (stats.length === 0) {
    const relaxedStats = allStats.filter(
      (entry) =>
        !entry.isExcludedRegion &&
        entry.logicalFieldCount >= RELAXED_MIN_LOGICAL_FIELDS &&
        entry.textLikeFieldCount >= 1 &&
        (entry.isFormSemantic || entry.hasSubmitControl || entry.textLikeFieldCount >= 2)
    );

    if (relaxedStats.length === 0) {
      cachedPrimaryContainer = null;
      cachedPrimaryContainerKey = null;
      return null;
    }

    relaxedStats.sort(compareCandidates);
    const relaxedBest = relaxedStats[0]?.container ?? null;
    cachedPrimaryContainer = relaxedBest;
    cachedPrimaryContainerKey = relaxedBest ? generateSelector(relaxedBest) : null;
    return relaxedBest;
  }

  stats.sort(compareCandidates);
  const best = stats[0]?.container ?? null;

  cachedPrimaryContainer = best;
  cachedPrimaryContainerKey = best ? generateSelector(best) : null;
  return best;
}

function isValidPrimaryContainer(container: HTMLElement): boolean {
  if (!container.isConnected) return false;
  if (cachedPrimaryContainerKey && generateSelector(container) !== cachedPrimaryContainerKey) {
    return false;
  }

  if (isInExcludedRegion(container)) return false;

  return countLogicalFields(queryEligibleControls(container)) >= RELAXED_MIN_LOGICAL_FIELDS;
}

function queryEligibleControls(root: ParentNode): FormControl[] {
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement>("input")).filter((el) => {
    const type = el.type.toLowerCase();
    if (DISALLOWED_INPUT_TYPES.has(type)) return false;
    return true;
  });
  const textareas = Array.from(root.querySelectorAll<HTMLTextAreaElement>("textarea"));
  const selects = Array.from(root.querySelectorAll<HTMLSelectElement>("select"));
  const richtext = Array.from(root.querySelectorAll<HTMLElement>("[contenteditable='true']"));
  const semanticControls = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[role='combobox'],[role='listbox'],[role='checkbox'],[role='radio'],[role='textbox']"
    )
  ).filter((el) => isStandaloneSemanticControl(el));

  const controls = [...inputs, ...textareas, ...selects, ...richtext, ...semanticControls];
  const unique = new Map<string, FormControl>();

  for (const control of controls) {
    const key = generateSelector(control);
    if (!unique.has(key)) {
      unique.set(key, control);
    }
  }

  return Array.from(unique.values()).filter((el) => isElementVisible(el) || isFileInput(el));
}

function collectCandidateContainers(controls: FormControl[]): Map<HTMLElement, CandidateAccumulator> {
  const byContainer = new Map<HTMLElement, CandidateAccumulator>();
  let domIndex = 0;

  for (const control of controls) {
    let current: HTMLElement | null = control instanceof HTMLElement ? control : null;
    let depth = 0;
    const controlSelector = generateSelector(control);
    const logicalKey = getLogicalKey(control, controlSelector);
    const textLike = isTextLikeControl(control);

    while (current && depth <= MAX_ANCESTOR_DEPTH) {
      if (!byContainer.has(current)) {
        byContainer.set(current, {
          logicalKeys: new Set<string>(),
          textLikeKeys: new Set<string>(),
          domIndex: domIndex++,
        });
      }
      const acc = byContainer.get(current);
      if (acc) {
        acc.logicalKeys.add(logicalKey);
        if (textLike) {
          acc.textLikeKeys.add(controlSelector);
        }
      }
      current = current.parentElement;
      depth++;
    }
  }

  return byContainer;
}

function buildCandidateStatsFromControls(
  candidates: Map<HTMLElement, CandidateAccumulator>
): CandidateStats[] {
  const stats: CandidateStats[] = [];

  for (const [container, acc] of candidates.entries()) {
    const rect = container.getBoundingClientRect();
    const visibleArea = Math.max(0, rect.width) * Math.max(0, rect.height);

    stats.push({
      container,
      logicalFieldCount: acc.logicalKeys.size,
      textLikeFieldCount: acc.textLikeKeys.size,
      hasSubmitControl: hasSubmitControl(container),
      isFormSemantic:
        container.tagName.toLowerCase() === "form" || container.getAttribute("role") === "form",
      isExcludedRegion: isInExcludedRegion(container),
      visibleArea,
      domIndex: acc.domIndex,
    });
  }

  return stats;
}

function compareCandidates(a: CandidateStats, b: CandidateStats): number {
  if (a.isExcludedRegion !== b.isExcludedRegion) return a.isExcludedRegion ? 1 : -1;
  if (a.logicalFieldCount !== b.logicalFieldCount) {
    return b.logicalFieldCount - a.logicalFieldCount;
  }
  if (a.textLikeFieldCount !== b.textLikeFieldCount) {
    return b.textLikeFieldCount - a.textLikeFieldCount;
  }
  if (a.hasSubmitControl !== b.hasSubmitControl) return a.hasSubmitControl ? -1 : 1;
  if (a.isFormSemantic !== b.isFormSemantic) return a.isFormSemantic ? -1 : 1;
  if (a.visibleArea !== b.visibleArea) return b.visibleArea - a.visibleArea;
  return a.domIndex - b.domIndex;
}

function isInExcludedRegion(container: HTMLElement): boolean {
  return container.matches(EXCLUDED_REGION_SELECTOR) || !!container.closest(EXCLUDED_REGION_SELECTOR);
}

function hasSubmitControl(container: HTMLElement): boolean {
  return !!container.querySelector(
    "button[type='submit'], input[type='submit'], button:not([type]), [data-testid*='submit' i], [aria-label*='submit' i]"
  );
}

function countLogicalFields(controls: FormControl[]): number {
  const keys = new Set<string>();

  for (const control of controls) {
    const selector = generateSelector(control);
    keys.add(getLogicalKey(control, selector));
  }

  return keys.size;
}

function getLogicalKey(control: FormControl, selector: string): string {
  if (control instanceof HTMLInputElement && control.type === "radio") {
    return control.name.trim().length > 0 ? `radio:${control.name}` : selector;
  }
  return selector;
}

function isTextLikeControl(control: FormControl): boolean {
  if (control instanceof HTMLInputElement) {
    const type = control.type.toLowerCase();
    return type !== "radio" && type !== "checkbox";
  }
  if (control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) {
    return true;
  }
  const role = (control.getAttribute("role") ?? "").toLowerCase();
  if (role === "combobox" || role === "listbox" || role === "textbox") {
    return true;
  }
  return control.getAttribute("contenteditable") === "true";
}

function isElementVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (isFileInput(el)) return true;
  if (el.hidden) return false;

  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;

  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function mapFieldType(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement
): FormField["type"] {
  const role = (el.getAttribute("role") ?? "").toLowerCase();
  if (role === "combobox" || role === "listbox") {
    return "Select";
  }
  if (role === "checkbox") {
    return "Checkbox";
  }
  if (role === "radio") {
    return "Radio";
  }
  if (el.getAttribute("contenteditable") === "true") {
    return "Richtext";
  }
  if (role === "textbox") {
    return "Text";
  }

  if (el instanceof HTMLInputElement) {
    const inputType = el.type.toLowerCase();
    if (inputType === "radio") return "Radio";
    if (inputType === "checkbox") return "Checkbox";
    if (inputType === "file") return "Text";
    return "Text";
  }

  if (el instanceof HTMLTextAreaElement) return "Textarea";
  if (el instanceof HTMLSelectElement) return "Select";

  return "Text";
}

function extractLabel(el: Element): string {
  const labelElements = getAssociatedLabelElements(el as FormControl);
  for (const labelEl of labelElements) {
    const labelText = normalizedText(labelEl.textContent);
    if (labelText.length > 0) {
      return labelText;
    }
  }

  const ariaLabel = el.getAttribute("aria-label")?.trim() ?? "";
  if (ariaLabel.length > 0) return ariaLabel;

  const name = el.getAttribute("name")?.trim() ?? "";
  if (name.length > 0) return name;

  const title = el.getAttribute("title")?.trim() ?? "";
  if (title.length > 0) return title;

  if ("placeholder" in el && typeof el.placeholder === "string") {
    const placeholder = el.placeholder.trim();
    if (placeholder.length > 0) return placeholder;
  }

  return "Unlabeled Field";
}

function extractContextText(el: Element): string {
  const describedBy = el.getAttribute("aria-describedby");
  if (describedBy) {
    const parts = describedBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
      .filter((text) => text.length > 0);

    if (parts.length > 0) {
      return parts.join(" ");
    }
  }

  const fieldset = el.closest("fieldset");
  const legend = fieldset?.querySelector("legend")?.textContent?.trim() ?? "";
  if (legend.length > 0) {
    return legend;
  }

  const containerText = el.parentElement?.childNodes
  ? Array.from(el.parentElement.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim() ?? "")
      .join(" ")
      .trim()
  : "";
  
  return containerText;
}

function isRequiredField(el: FormControl): boolean {
  if (hasRequiredAttributeSignal(el)) {
    return true;
  }
  if (hasRequiredLabelMarker(el)) {
    return true;
  }
  if (hasRequiredGroupSignal(el)) {
    return true;
  }
  if (hasInvalidEmptySignal(el)) {
    return true;
  }
  return false;
}

function isFileInput(el: Element): el is HTMLInputElement {
  return el instanceof HTMLInputElement && el.type.toLowerCase() === "file";
}

function isStandaloneSemanticControl(el: HTMLElement): boolean {
  const role = (el.getAttribute("role") ?? "").toLowerCase();
  if (role.length === 0) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  if (!isElementVisible(el)) return false;

  if (el.parentElement) {
    const siblings = Array.from(el.parentElement.children).filter((child) => child !== el);
    const hasNativeSibling = siblings.some((child) =>
      child.matches("input, textarea, select, [contenteditable='true']")
    );
    if (hasNativeSibling) return false;
  }

  return !el.querySelector(
    "input, textarea, select, [contenteditable='true'], [role='combobox'], [role='listbox'], [role='checkbox'], [role='radio'], [role='textbox']"
  );
}

function hasRequiredAttributeSignal(el: FormControl): boolean {
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    if (el.required) return true;
  }

  if (el.hasAttribute("required")) return true;

  const ariaRequired = (el.getAttribute("aria-required") ?? "").trim().toLowerCase();
  if (REQUIRED_TRUE_VALUES.has(ariaRequired)) return true;

  const dataRequired = (el.getAttribute("data-required") ?? "").trim().toLowerCase();
  if (REQUIRED_TRUE_VALUES.has(dataRequired)) return true;

  return false;
}

function hasRequiredGroupSignal(el: FormControl): boolean {
  if (!(el instanceof HTMLInputElement)) return false;
  if (el.type.toLowerCase() !== "radio") return false;
  if (el.name.trim().length === 0) return false;

  const escapedName = escapeCssSelector(el.name);
  const group = Array.from(
    document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${escapedName}"]`)
  );
  return group.some((radio) => hasRequiredAttributeSignal(radio));
}

function hasRequiredLabelMarker(el: FormControl): boolean {
  const labels = getAssociatedLabelElements(el);
  return labels.some((label) => labelContainsRequiredMarker(label));
}

function getAssociatedLabelElements(el: FormControl): HTMLElement[] {
  const labels: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  const add = (candidate: HTMLElement | null): void => {
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    labels.push(candidate);
  };

  const id = el.getAttribute("id");
  if (id) {
    const escapedId = escapeCssSelector(id);
    add(document.querySelector<HTMLElement>(`label[for="${escapedId}"]`));
  }

  add(el.closest("label"));

  const ariaLabelledBy = el.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    for (const labelId of ariaLabelledBy.split(/\s+/)) {
      const label = document.getElementById(labelId);
      if (label instanceof HTMLElement) {
        add(label);
      }
    }
  }

  const previousCandidate = findSiblingLabelCandidate(el, "previous");
  if (previousCandidate) add(previousCandidate);

  const inputRole = mapFieldType(el);
  if (inputRole === "Checkbox" || inputRole === "Radio") {
    const nextCandidate = findSiblingLabelCandidate(el, "next");
    if (nextCandidate) add(nextCandidate);
  }

  return labels;
}

function findSiblingLabelCandidate(
  el: FormControl,
  direction: "previous" | "next"
): HTMLElement | null {
  let sibling: Element | null =
    direction === "previous" ? el.previousElementSibling : el.nextElementSibling;

  while (sibling) {
    if (sibling instanceof HTMLElement) {
      if (sibling.matches("input, textarea, select, button")) {
        sibling = direction === "previous" ? sibling.previousElementSibling : sibling.nextElementSibling;
        continue;
      }

      const text = normalizedText(sibling.textContent);
      if (text.length > 0) {
        return sibling;
      }
    }
    sibling = direction === "previous" ? sibling.previousElementSibling : sibling.nextElementSibling;
  }

  return null;
}

function normalizedText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function labelContainsRequiredMarker(labelEl: HTMLElement): boolean {
  const directText = labelEl.textContent ?? "";
  if (directText.includes("*")) return true;

  for (const child of Array.from(labelEl.querySelectorAll<HTMLElement>("*"))) {
    const childText = child.textContent ?? "";
    if (childText.includes("*")) return true;
  }

  return false;
}

function hasInvalidEmptySignal(el: FormControl): boolean {
  const ariaInvalid = (el.getAttribute("aria-invalid") ?? "").trim().toLowerCase();
  if (!REQUIRED_TRUE_VALUES.has(ariaInvalid)) return false;
  return isControlValueEmpty(el);
}

function isControlValueEmpty(el: FormControl): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value.trim().length === 0;
  }
  if (el instanceof HTMLSelectElement) {
    return (el.value ?? "").trim().length === 0;
  }
  const value = (el.getAttribute("aria-valuetext") ?? "").trim();
  if (value.length > 0) return false;
  return (el.textContent ?? "").trim().length === 0;
}

function generateStableId(el: Element, index: number): string {
  const path = generateSelector(el);
  return `field-${index}-${hashString(path)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString();
}

function generateSelector(el: Element): string {
  if (el.id) return `#${escapeCssSelector(el.id)}`;

  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();

    if (current.id) {
      selector += `#${escapeCssSelector(current.id)}`;
      parts.unshift(selector);
      break;
    } else {
      let sibling: Element | null = current;
      let nth = 1;

      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.nodeName === current.nodeName) nth++;
      }

      selector += `:nth-of-type(${nth})`;
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

function escapeCssSelector(value: string): string {
  return typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(value)
    : value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}
