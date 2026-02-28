import type { InputKind } from "../../shared/types";

export type EditableElement = HTMLTextAreaElement | HTMLElement;

export function isEditableElement(element: EventTarget | null): element is EditableElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element instanceof HTMLTextAreaElement) {
    return true;
  }

  return element.isContentEditable;
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
