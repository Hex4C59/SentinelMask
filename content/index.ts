import { isEditableElement, type EditableElement } from "../core/text/input-accessor";
import { resolveSiteAdapter } from "./adapters";
import { runGatewayWithFailSafe } from "./pre-send-gateway";

const adapter = resolveSiteAdapter(window.location.hostname);
let isComposing = false;
let replayDepth = 0;

function withReplay(action: () => void): void {
  replayDepth += 1;
  try {
    action();
  } finally {
    replayDepth -= 1;
  }
}

function resolveEditableFromTarget(target: EventTarget | null): EditableElement | null {
  if (!target) {
    return null;
  }

  if (isEditableElement(target)) {
    return target;
  }

  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const direct = target.closest("textarea, [contenteditable='true']");
  if (direct && isEditableElement(direct)) {
    return direct;
  }

  const active = document.activeElement;
  if (isEditableElement(active)) {
    return active;
  }

  return null;
}

function resolveEditableFromForm(form: HTMLFormElement): EditableElement | null {
  const candidate = form.querySelector("textarea, [contenteditable='true']");
  if (candidate && isEditableElement(candidate)) {
    return candidate;
  }
  const active = document.activeElement;
  if (isEditableElement(active)) {
    return active;
  }
  return null;
}

function replayKeyboardEvent(target: EditableElement, triggerEvent: KeyboardEvent): void {
  withReplay(() => {
    const replayEvent = new KeyboardEvent("keydown", {
      key: triggerEvent.key,
      code: triggerEvent.code,
      ctrlKey: triggerEvent.ctrlKey,
      metaKey: triggerEvent.metaKey,
      shiftKey: triggerEvent.shiftKey,
      bubbles: true,
      cancelable: true
    });
    target.dispatchEvent(replayEvent);
  });
}

function shouldCaptureEnter(event: KeyboardEvent): boolean {
  if (event.key !== "Enter") {
    return false;
  }
  if (event.defaultPrevented || replayDepth > 0) {
    return false;
  }
  if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
    return false;
  }
  return true;
}

function onKeyDownCapture(event: KeyboardEvent): void {
  if (!shouldCaptureEnter(event)) {
    return;
  }

  const editable = resolveEditableFromTarget(event.target);
  if (!editable) {
    return;
  }

  const trigger = event.ctrlKey || event.metaKey ? "ctrl_enter" : "enter";

  event.preventDefault();
  event.stopImmediatePropagation();

  void runGatewayWithFailSafe({
    trigger,
    editable,
    site: window.location.hostname,
    isComposing,
    replaySend: () => replayKeyboardEvent(editable, event)
  });
}

function onClickCapture(event: MouseEvent): void {
  if (event.defaultPrevented || replayDepth > 0) {
    return;
  }

  const rawTarget = event.target;
  if (!(rawTarget instanceof HTMLElement)) {
    return;
  }

  const button = rawTarget.closest("button, [role='button']");
  if (!(button instanceof HTMLElement) || !adapter.isSendButton(button)) {
    return;
  }

  const editable = resolveEditableFromTarget(rawTarget);
  if (!editable) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  void runGatewayWithFailSafe({
    trigger: "button_click",
    editable,
    site: window.location.hostname,
    isComposing,
    replaySend: () => withReplay(() => button.click())
  });
}

function onSubmitCapture(event: SubmitEvent): void {
  if (event.defaultPrevented || replayDepth > 0) {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLFormElement)) {
    return;
  }

  const editable = resolveEditableFromForm(target);
  if (!editable) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  void runGatewayWithFailSafe({
    trigger: "submit",
    editable,
    site: window.location.hostname,
    isComposing,
    replaySend: () =>
      withReplay(() => {
        if (typeof target.requestSubmit === "function") {
          target.requestSubmit();
        } else {
          target.submit();
        }
      })
  });
}

function patchProgrammaticSend(): void {
  const nativeRequestSubmit = HTMLFormElement.prototype.requestSubmit;
  const nativeSubmit = HTMLFormElement.prototype.submit;
  const nativeClick = HTMLElement.prototype.click;

  HTMLFormElement.prototype.requestSubmit = function patchedRequestSubmit(
    this: HTMLFormElement,
    ...args: Parameters<HTMLFormElement["requestSubmit"]>
  ) {
    if (replayDepth > 0) {
      return nativeRequestSubmit.apply(this, args);
    }

    const editable = resolveEditableFromForm(this);
    if (!editable) {
      return nativeRequestSubmit.apply(this, args);
    }

    void runGatewayWithFailSafe({
      trigger: "programmatic",
      editable,
      site: window.location.hostname,
      isComposing,
      replaySend: () => withReplay(() => nativeRequestSubmit.apply(this, args))
    });
  };

  HTMLFormElement.prototype.submit = function patchedSubmit(
    this: HTMLFormElement,
    ...args: Parameters<HTMLFormElement["submit"]>
  ) {
    if (replayDepth > 0) {
      return nativeSubmit.apply(this, args);
    }

    const editable = resolveEditableFromForm(this);
    if (!editable) {
      return nativeSubmit.apply(this, args);
    }

    void runGatewayWithFailSafe({
      trigger: "programmatic",
      editable,
      site: window.location.hostname,
      isComposing,
      replaySend: () => withReplay(() => nativeSubmit.apply(this, args))
    });
  };

  HTMLElement.prototype.click = function patchedClick(
    this: HTMLElement,
    ...args: Parameters<HTMLElement["click"]>
  ) {
    if (replayDepth > 0 || !adapter.isSendButton(this)) {
      return nativeClick.apply(this, args);
    }

    const editable = resolveEditableFromTarget(this);
    if (!editable) {
      return nativeClick.apply(this, args);
    }

    void runGatewayWithFailSafe({
      trigger: "programmatic",
      editable,
      site: window.location.hostname,
      isComposing,
      replaySend: () => withReplay(() => nativeClick.apply(this, args))
    });
  };
}

function bootstrap(): void {
  document.addEventListener("compositionstart", () => {
    isComposing = true;
  });
  document.addEventListener("compositionend", () => {
    isComposing = false;
  });

  document.addEventListener("keydown", onKeyDownCapture, true);
  document.addEventListener("click", onClickCapture, true);
  document.addEventListener("submit", onSubmitCapture, true);

  patchProgrammaticSend();
}

bootstrap();
