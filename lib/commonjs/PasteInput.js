"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNative = require("react-native");
var _NativePasteInputModule = _interopRequireDefault(require("./NativePasteInputModule"));
var _PasteTextInput = _interopRequireDefault(require("./PasteTextInput"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
/**
 * PasteInput - A TextInput wrapper that intercepts file paste events
 *
 * This component uses a hybrid approach:
 * - iOS: Wraps standard TextInput + TurboModule with dynamic subclassing
 * - Android: Uses custom PasteTextInput ComponentView (extends ReactEditText)
 *
 * Architecture:
 * iOS:
 * - Wraps standard React Native TextInput (100% compatible)
 * - Registers the TextInput ref with native module on mount
 * - Native module hooks into the backing UITextView for paste interception using ISA swizzling
 * - Emits events when files are pasted via TurboModule
 * - Unregisters on unmount
 *
 * Android:
 * - Renders custom PasteTextInput native component (extends ReactEditText)
 * - Overrides onCreateInputConnection to intercept paste via InputConnectionCompat
 * - Cannot do runtime method swizzling like iOS, so requires custom component
 * - Emits events when files are pasted via ViewManager event
 */

// In Fabric, TurboModules can be used directly as the event emitter (iOS only)
const PasteInputEventEmitter = _reactNative.Platform.OS === 'ios' ? new _reactNative.NativeEventEmitter(_NativePasteInputModule.default) : null;
function PasteInputIOSComponent(props, forwardedRef) {
  const {
    onPaste,
    disableCopyPaste = false,
    smartPunctuation = 'default',
    ...textInputProps
  } = props;
  const textInputRef = (0, _react.useRef)(null);
  const nativeIDRef = (0, _react.useRef)(null);
  const onPasteRef = (0, _react.useRef)(onPaste);

  // Keep the ref pointed at the latest onPaste so the event listener
  // (registered once on mount) always calls the current handler.
  (0, _react.useEffect)(() => {
    onPasteRef.current = onPaste;
  }, [onPaste]);

  // Expose the TextInput ref to parent components (same as Android)
  // TextInput already has all methods from PasteTextInputInstance (clear, isFocused, setSelection)
  (0, _react.useImperativeHandle)(forwardedRef, () => {
    if (textInputRef.current) {
      return textInputRef.current;
    }
    // Return a no-op implementation if ref is not yet available
    return {
      clear: () => {},
      isFocused: () => false,
      setSelection: () => {}
    };
  }, []);

  // Register/unregister with native module on mount/unmount
  (0, _react.useEffect)(() => {
    // Get the native tag from the ref's internal __nativeTag property
    // @ts-ignore - __nativeTag is an internal property
    const nativeTag = textInputRef.current?.__nativeTag;
    if (!nativeTag) {
      if (__DEV__) {
        console.warn('[PasteInput] Could not get native tag from ref');
      }
      return;
    }

    // Use the actual React native tag as the identifier
    const nativeID = `PasteInput_${nativeTag}`;
    nativeIDRef.current = nativeID;

    // Register this TextInput instance by passing the nativeID
    _NativePasteInputModule.default.registerTextInput(nativeID, {
      disableCopyPaste,
      smartPunctuation
    });

    // Listen for paste events
    const subscription = PasteInputEventEmitter.addListener('onPaste', event => {
      // Only handle events for this instance
      if (event.nativeID === nativeID) {
        onPasteRef.current?.(event.error || null, event.data);
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.remove();
      _NativePasteInputModule.default.unregisterTextInput(nativeID);
    };
  }, []); // Empty deps - only run on mount/unmount

  // Update config if props change
  (0, _react.useEffect)(() => {
    if (nativeIDRef.current) {
      _NativePasteInputModule.default.registerTextInput(nativeIDRef.current, {
        disableCopyPaste,
        smartPunctuation
      });
    }
  }, [disableCopyPaste, smartPunctuation]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.TextInput, {
    ref: textInputRef,
    ...textInputProps
  });
}
function PasteInputAndroidComponent(props, forwardedRef) {
  const {
    onPaste,
    ...pasteTextInputProps
  } = props;
  const pasteTextInputRef = (0, _react.useRef)(null);

  // Expose the PasteTextInput ref to parent components (same as iOS)
  (0, _react.useImperativeHandle)(forwardedRef, () => {
    if (pasteTextInputRef.current) {
      return pasteTextInputRef.current;
    }
    // Return a no-op implementation if ref is not yet available
    return {
      clear: () => {},
      isFocused: () => false,
      setSelection: () => {}
    };
  }, []);

  // For Android, PasteTextInput already handles everything internally
  // Just need to adapt the onPaste callback format
  const handlePaste = (error, files) => {
    if (onPaste) {
      onPaste(error, files);
    }
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PasteTextInput.default, {
    ref: pasteTextInputRef,
    ...pasteTextInputProps,
    onPaste: handlePaste
  });
}
const PasteInputComponent = _reactNative.Platform.OS === 'ios' ? PasteInputIOSComponent : PasteInputAndroidComponent;
var _default = exports.default = /*#__PURE__*/(0, _react.forwardRef)(PasteInputComponent);
//# sourceMappingURL=PasteInput.js.map