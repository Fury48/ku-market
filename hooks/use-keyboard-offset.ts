import { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useKeyboardOffset() {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const webBaseHeightRef = useRef(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return;
      }

      const viewport = window.visualViewport;

      function isTextInputFocused() {
        const activeElement = document.activeElement;

        return (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute('contenteditable') === 'true'
        );
      }

      function updateWebKeyboardHeight() {
        const visualHeight = viewport?.height ?? window.innerHeight;
        const isNarrowScreen = window.innerWidth <= 768;

        if (!isTextInputFocused()) {
          webBaseHeightRef.current = Math.max(webBaseHeightRef.current, window.innerHeight, visualHeight);
          setKeyboardHeight(0);
          return;
        }

        webBaseHeightRef.current = Math.max(webBaseHeightRef.current, window.innerHeight, visualHeight);
        const coveredHeight = Math.max(0, webBaseHeightRef.current - visualHeight - (viewport?.offsetTop ?? 0));

        setKeyboardHeight(isNarrowScreen ? Math.max(coveredHeight, 1) : coveredHeight > 80 ? coveredHeight : 0);
      }

      webBaseHeightRef.current = window.innerHeight;
      updateWebKeyboardHeight();

      window.addEventListener('focusin', updateWebKeyboardHeight);
      window.addEventListener('focusout', updateWebKeyboardHeight);
      window.addEventListener('resize', updateWebKeyboardHeight);
      viewport?.addEventListener('resize', updateWebKeyboardHeight);
      viewport?.addEventListener('scroll', updateWebKeyboardHeight);

      return () => {
        window.removeEventListener('focusin', updateWebKeyboardHeight);
        window.removeEventListener('focusout', updateWebKeyboardHeight);
        window.removeEventListener('resize', updateWebKeyboardHeight);
        viewport?.removeEventListener('resize', updateWebKeyboardHeight);
        viewport?.removeEventListener('scroll', updateWebKeyboardHeight);
      };
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const visibleWindowHeight = Dimensions.get('window').height;
      const coveredHeight = visibleWindowHeight - event.endCoordinates.screenY;
      setKeyboardHeight(Math.max(0, coveredHeight - insets.bottom));
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [insets.bottom]);

  return keyboardHeight;
}
