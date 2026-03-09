import type { InputKind } from "../../shared/types";

export type EditableElement = HTMLTextAreaElement | HTMLElement;

const editableSelector = "textarea, [contenteditable]:not([contenteditable='false'])";

function hasEditableAttribute(element: HTMLElement): boolean {
  const value = element.getAttribute("contenteditable");
  return value !== null && value.toLowerCase() !== "false";
}

export function isEditableElement(element: EventTarget | null): element is EditableElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element instanceof HTMLTextAreaElement) {
    return true;
  }

  return element.isContentEditable || hasEditableAttribute(element);
}

export function findClosestEditable(element: HTMLElement): EditableElement | null {
  const candidate = element.closest(editableSelector);
  return isEditableElement(candidate) ? candidate : null;
}

export function findEditableWithin(root: ParentNode): EditableElement | null {
  const candidates = root.querySelectorAll(editableSelector);

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const candidate = candidates.item(index);
    if (isEditableElement(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function resolveInputKind(element: EditableElement): InputKind {
  return element instanceof HTMLTextAreaElement ? "textarea" : "contenteditable";
}

export function readTextFromElement(element: EditableElement): string {
  if (element instanceof HTMLTextAreaElement) {
    return element.value;
  }
  return element.innerText || element.textContent || "";
}

export function writeTextToElement(element: EditableElement, value: string): void {
  if (element instanceof HTMLTextAreaElement) {
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  element.textContent = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}
