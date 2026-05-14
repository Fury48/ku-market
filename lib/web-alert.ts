import { Alert, Platform, type AlertButton } from 'react-native';

let installed = false;

function formatMessage(title: string, message?: string) {
  return [title, message].filter(Boolean).join('\n\n');
}

function findCancelButton(buttons: AlertButton[]) {
  return buttons.find((button) => button.style === 'cancel');
}

function runSingleAction(text: string, button?: AlertButton) {
  globalThis.alert(text);
  button?.onPress?.();
}

function runConfirmAction(text: string, buttons: AlertButton[]) {
  const cancelButton = findCancelButton(buttons);
  const actionButton = buttons.find((button) => button.style !== 'cancel') ?? buttons[0];

  if (globalThis.confirm(text)) {
    actionButton?.onPress?.();
    return;
  }

  cancelButton?.onPress?.();
}

function runChoiceAction(text: string, buttons: AlertButton[]) {
  const options = buttons.map((button, index) => `${index + 1}. ${button.text ?? 'OK'}`).join('\n');
  const choice = globalThis.prompt(`${text}\n\n${options}\n\nEnter a number:`);
  const index = Number(choice) - 1;

  if (Number.isInteger(index) && index >= 0 && index < buttons.length) {
    buttons[index]?.onPress?.();
    return;
  }

  findCancelButton(buttons)?.onPress?.();
}

export function installWebAlert() {
  if (installed || Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  installed = true;

  Alert.alert = (title, message, buttons) => {
    const text = formatMessage(String(title), message ? String(message) : undefined);
    const usableButtons = buttons?.filter(Boolean) ?? [];

    if (usableButtons.length === 0) {
      globalThis.alert(text);
      return;
    }

    if (usableButtons.length === 1) {
      runSingleAction(text, usableButtons[0]);
      return;
    }

    if (usableButtons.length === 2 && usableButtons.some((button) => button.style === 'cancel')) {
      runConfirmAction(text, usableButtons);
      return;
    }

    runChoiceAction(text, usableButtons);
  };
}
