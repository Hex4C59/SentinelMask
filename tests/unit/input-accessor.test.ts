// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import {
  findClosestEditable,
  findEditableWithin,
  isEditableElement
} from "../../core/text/input-accessor";

describe("input-accessor", () => {
  it("recognizes contenteditable plaintext-only as editable", () => {
    const element = document.createElement("div");
    element.setAttribute("contenteditable", "plaintext-only");

    expect(isEditableElement(element)).toBe(true);
  });

  it("finds closest editable for nested send button structures", () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div contenteditable="plaintext-only">
        <span>hello</span>
        <button type="button"><span id="inner">send</span></button>
      </div>
    `;

    const target = wrapper.querySelector("#inner");
    expect(target).toBeInstanceOf(HTMLElement);

    const editable = findClosestEditable(target as HTMLElement);
    expect(editable).toBeInstanceOf(HTMLElement);
    expect((editable as HTMLElement).getAttribute("contenteditable")).toBe("plaintext-only");
  });

  it("prefers the last editable inside a form", () => {
    const form = document.createElement("form");
    form.innerHTML = `
      <div contenteditable="true">draft</div>
      <div class="composer" contenteditable="plaintext-only">final</div>
    `;

    const editable = findEditableWithin(form);
    expect(editable).toBeInstanceOf(HTMLElement);
    expect((editable as HTMLElement).className).toBe("composer");
  });
});
