"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
var _PasteTextInputNativeComponent = _interopRequireWildcard(require("./PasteTextInputNativeComponent"));
var _reactNative = require("react-native");
var _TextAncestor = _interopRequireDefault(require("react-native/Libraries/Text/TextAncestor"));
var _TextInputState = _interopRequireDefault(require("react-native/Libraries/Components/TextInput/TextInputState"));
var _usePressability = _interopRequireDefault(require("react-native/Libraries/Pressability/usePressability"));
var _flattenStyle = _interopRequireDefault(require("react-native/Libraries/StyleSheet/flattenStyle"));
var _nullthrows = _interopRequireDefault(require("nullthrows"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
const emptyFunctionThatReturnsTrue = () => true;
function useMergeRefs(...refs) {
  return React.useCallback(current => {
    for (const ref of refs) {
      if (ref != null) {
        if (typeof ref === 'function') {
          ref(current);
        } else {
          ref.current = current;
        }
      }
    }
  }, [...refs]);
}
function InternalTextInput(props) {
  const {
    'aria-busy': ariaBusy,
    'aria-checked': ariaChecked,
    'aria-disabled': ariaDisabled,
    'aria-expanded': ariaExpanded,
    'aria-selected': ariaSelected,
    accessibilityState,
    id,
    tabIndex,
    'selection': propsSelection,
    selectionColor,
    selectionHandleColor,
    cursorColor,
    ...otherProps
  } = props;
  const inputRef = React.useRef(null);
  const selection = React.useMemo(() => propsSelection == null ? null : {
    start: propsSelection.start,
    end: propsSelection.end ?? propsSelection.start
  }, [propsSelection]);
  const [mostRecentEventCount, setMostRecentEventCount] = React.useState(0);
  const [lastNativeText, setLastNativeText] = React.useState(props.value);
  const [lastNativeSelectionState, setLastNativeSelection] = React.useState({
    selection: {
      start: -1,
      end: -1
    },
    mostRecentEventCount
  });
  const lastNativeSelection = lastNativeSelectionState.selection;
  const text = typeof props.value === 'string' ? props.value : typeof props.defaultValue === 'string' ? props.defaultValue : undefined;
  React.useLayoutEffect(() => {
    const nativeUpdate = {};
    if (lastNativeText !== props.value && typeof props.value === 'string') {
      nativeUpdate.text = props.value;
      setLastNativeText(props.value);
    }
    if (selection && lastNativeSelection && (lastNativeSelection.start !== selection.start || lastNativeSelection.end !== selection.end)) {
      nativeUpdate.selection = selection;
      setLastNativeSelection({
        selection: selection,
        mostRecentEventCount
      });
    }
    if (Object.keys(nativeUpdate).length === 0) {
      return;
    }
    if (inputRef.current != null) {
      _PasteTextInputNativeComponent.Commands.setTextAndSelection(inputRef.current, mostRecentEventCount, text, selection?.start ?? -1, selection?.end ?? -1);
    }
  }, [mostRecentEventCount, inputRef, props.value, props.defaultValue, lastNativeText, selection, lastNativeSelection, text]);
  React.useLayoutEffect(() => {
    const inputRefValue = inputRef.current;
    if (inputRefValue != null) {
      _TextInputState.default.registerInput(inputRefValue);
    }
    return () => {
      if (inputRefValue != null) {
        _TextInputState.default.unregisterInput(inputRefValue);
      }
      if (_TextInputState.default.currentlyFocusedInput() === inputRefValue) {
        (0, _nullthrows.default)(inputRefValue).blur();
      }
    };
  }, [inputRef]);
  const setLocalRef = React.useCallback(instance => {
    inputRef.current = instance;
    if (instance != null) {
      _TextInputState.default.registerInput(instance);
      Object.assign(instance, {
        clear() {
          if (inputRef.current != null) {
            _PasteTextInputNativeComponent.Commands.setTextAndSelection(inputRef.current, mostRecentEventCount, '', 0, 0);
          }
        },
        isFocused() {
          return _TextInputState.default.currentlyFocusedInput() === inputRef.current;
        },
        getNativeRef() {
          return inputRef.current;
        },
        setSelection(start, end) {
          if (inputRef.current != null) {
            _PasteTextInputNativeComponent.Commands.setTextAndSelection(inputRef.current, mostRecentEventCount, null, start, end);
          }
        }
      });
    }
  }, [mostRecentEventCount]);
  const ref = useMergeRefs(setLocalRef, props.forwardedRef);
  const _onChange = event => {
    const currentText = event.nativeEvent.text;
    props.onChange && props.onChange(event);
    props.onChangeText && props.onChangeText(currentText);
    if (inputRef.current == null) {
      return;
    }
    setLastNativeText(currentText);
    setMostRecentEventCount(event.nativeEvent.eventCount);
  };
  const _onBlur = event => {
    _TextInputState.default.blurInput(inputRef.current);
    if (props.onBlur) {
      props.onBlur(event);
    }
  };
  const _onFocus = event => {
    _TextInputState.default.focusInput(inputRef.current);
    if (props.onFocus) {
      props.onFocus(event);
    }
  };
  const _onPaste = event => {
    if (props.onPaste) {
      const {
        data,
        error
      } = event.nativeEvent;
      props.onPaste(error?.message, data);
    }
  };
  const _onScroll = event => {
    props.onScroll && props.onScroll(event);
  };
  const _onSelectionChange = event => {
    props.onSelectionChange && props.onSelectionChange(event);
    if (inputRef.current == null) {
      return;
    }
    setLastNativeSelection({
      selection: event.nativeEvent.selection,
      mostRecentEventCount
    });
  };
  const multiline = props.multiline ?? false;
  let submitBehavior;
  if (props.submitBehavior != null) {
    if (!multiline && props.submitBehavior === 'newline') {
      submitBehavior = 'blurAndSubmit';
    } else {
      submitBehavior = props.submitBehavior;
    }
  } else if (multiline) {
    if (props.blurOnSubmit === true) {
      submitBehavior = 'blurAndSubmit';
    } else {
      submitBehavior = 'newline';
    }
  } else {
    if (props.blurOnSubmit !== false) {
      submitBehavior = 'blurAndSubmit';
    } else {
      submitBehavior = 'submit';
    }
  }
  const accessible = props.accessible !== false;
  const focusable = props.focusable !== false;
  const {
    editable,
    hitSlop,
    onPress,
    onPressIn,
    onPressOut
  } = props;
  const config = React.useMemo(() => ({
    hitSlop,
    onPress: event => {
      onPress?.(event);
      if (editable !== false) {
        if (inputRef.current != null) {
          inputRef.current.focus();
        }
      }
    },
    onPressIn: onPressIn,
    onPressOut: onPressOut,
    cancelable: null // Android does not use this
  }), [editable, hitSlop, onPress, onPressIn, onPressOut]);
  let caretHidden = props.caretHidden;
  if (_reactNative.Platform.isTesting) {
    caretHidden = true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    onBlur,
    onFocus,
    ...eventHandlers
  } = (0, _usePressability.default)(config) || {};
  let _accessibilityState;
  if (accessibilityState != null || ariaBusy != null || ariaChecked != null || ariaDisabled != null || ariaExpanded != null || ariaSelected != null) {
    _accessibilityState = {
      busy: ariaBusy ?? accessibilityState?.busy,
      checked: ariaChecked ?? accessibilityState?.checked,
      disabled: ariaDisabled ?? accessibilityState?.disabled,
      expanded: ariaExpanded ?? accessibilityState?.expanded,
      selected: ariaSelected ?? accessibilityState?.selected
    };
  }

  // Keep original (potentially nested) style; only flatten to check for overrides
  let _style = props.style;
  // @ts-ignore
  const flattenedStyle = (0, _flattenStyle.default)(props.style);
  if (flattenedStyle != null) {
    let overrides = null;
    if (typeof flattenedStyle.fontWeight === 'number') {
      overrides = overrides ?? {};
      overrides.fontWeight = flattenedStyle.fontWeight.toString();
    }
    if (flattenedStyle.verticalAlign != null) {
      overrides = overrides ?? {};
      overrides.textAlignVertical = verticalAlignToTextAlignVerticalMap[flattenedStyle.verticalAlign];
      overrides.verticalAlign = undefined;
    }
    if (overrides != null) {
      _style = [_style, overrides];
    }
  }
  const _accessibilityLabel = props?.['aria-label'] ?? props?.accessibilityLabel;
  const _accessibilityLabelledBy = props?.['aria-labelledby'] ?? props?.accessibilityLabelledBy;
  const _importantForAccessibility = props['aria-hidden'] === true ? 'no-hide-descendants' : undefined;
  const autoCapitalize = props.autoCapitalize || 'sentences';
  const placeholder = props.placeholder ?? '';
  let children = props.children;
  const childCount = React.Children.count(children);
  if (props.value != null && childCount) {
    throw new Error('Cannot specify both value and children.');
  }
  if (childCount > 1) {
    children = /*#__PURE__*/(0, _jsxRuntime.jsx)(_reactNative.Text, {
      children: children
    });
  }
  const colorProps = {
    selectionColor,
    selectionHandleColor: selectionHandleColor === undefined ? selectionColor : selectionHandleColor,
    cursorColor: cursorColor === undefined ? selectionColor : cursorColor
  };
  const textInput = /*#__PURE__*/(0, _jsxRuntime.jsx)(_PasteTextInputNativeComponent.default, {
    ref: ref,
    ...otherProps,
    ...colorProps,
    ...eventHandlers,
    accessibilityLabel: _accessibilityLabel,
    accessibilityLabelledBy: _accessibilityLabelledBy,
    accessibilityState: _accessibilityState,
    accessible: accessible,
    autoCapitalize: autoCapitalize,
    submitBehavior: submitBehavior,
    caretHidden: caretHidden,
    children: children,
    disableFullscreenUI: props.disableFullscreenUI,
    focusable: tabIndex !== undefined ? !tabIndex : focusable,
    importantForAccessibility: _importantForAccessibility,
    mostRecentEventCount: mostRecentEventCount,
    nativeID: id ?? props.nativeID,
    numberOfLines: props.rows ?? props.numberOfLines,
    onBlur: _onBlur,
    onChange: _onChange,
    onContentSizeChange: props.onContentSizeChange,
    onFocus: _onFocus,
    onPaste: _onPaste,
    onScroll: _onScroll,
    onSelectionChange: _onSelectionChange,
    onSelectionChangeShouldSetResponder: emptyFunctionThatReturnsTrue,
    placeholder: placeholder,
    style: _style,
    text: text,
    textBreakStrategy: props.textBreakStrategy
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_TextAncestor.default.Provider, {
    value: true,
    children: textInput
  });
}
const enterKeyHintToReturnTypeMap = {
  enter: 'default',
  done: 'done',
  go: 'go',
  next: 'next',
  previous: 'previous',
  search: 'search',
  send: 'send'
};
const inputModeToKeyboardTypeMap = {
  none: 'default',
  text: 'default',
  decimal: 'decimal-pad',
  numeric: 'number-pad',
  tel: 'phone-pad',
  search: 'default',
  // Android has no web-search keyboard type
  email: 'email-address',
  url: 'url'
};
const autoCompleteWebToAutoCompleteAndroidMap = {
  'address-line1': 'postal-address-region',
  'address-line2': 'postal-address-locality',
  'bday': 'birthdate-full',
  'bday-day': 'birthdate-day',
  'bday-month': 'birthdate-month',
  'bday-year': 'birthdate-year',
  'cc-csc': 'cc-csc',
  'cc-exp': 'cc-exp',
  'cc-exp-month': 'cc-exp-month',
  'cc-exp-year': 'cc-exp-year',
  'cc-number': 'cc-number',
  'country': 'postal-address-country',
  'current-password': 'password',
  'email': 'email',
  'honorific-prefix': 'name-prefix',
  'honorific-suffix': 'name-suffix',
  'name': 'name',
  'additional-name': 'name-middle',
  'family-name': 'name-family',
  'given-name': 'name-given',
  'new-password': 'password-new',
  'off': 'off',
  'one-time-code': 'sms-otp',
  'postal-code': 'postal-code',
  'sex': 'gender',
  'street-address': 'street-address',
  'tel': 'tel',
  'tel-country-code': 'tel-country-code',
  'tel-national': 'tel-national',
  'username': 'username'
};
const verticalAlignToTextAlignVerticalMap = {
  auto: 'auto',
  top: 'top',
  bottom: 'bottom',
  middle: 'center'
};
const ExportedForwardRef = /*#__PURE__*/React.forwardRef(function PasteTextInput({
  allowFontScaling = true,
  underlineColorAndroid = 'transparent',
  autoComplete,
  readOnly,
  editable,
  enterKeyHint,
  returnKeyType,
  inputMode,
  showSoftInputOnFocus,
  keyboardType,
  ...restProps
}, forwardedRef) {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(InternalTextInput, {
    allowFontScaling: allowFontScaling,
    underlineColorAndroid: underlineColorAndroid,
    editable: readOnly !== undefined ? !readOnly : editable,
    returnKeyType: enterKeyHint ? enterKeyHintToReturnTypeMap[enterKeyHint] : returnKeyType,
    keyboardType: inputMode ? inputModeToKeyboardTypeMap[inputMode] : keyboardType,
    showSoftInputOnFocus: inputMode == null ? showSoftInputOnFocus : inputMode !== 'none',
    autoComplete:
    // @ts-ignore
    autoCompleteWebToAutoCompleteAndroidMap[autoComplete] ?? autoComplete,
    ...restProps,
    forwardedRef: forwardedRef
  });
});
ExportedForwardRef.displayName = 'PasteTextInput';
var _default = exports.default = ExportedForwardRef;
//# sourceMappingURL=PasteTextInput.js.map