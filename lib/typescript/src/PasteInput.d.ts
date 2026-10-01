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
import React from 'react';
import type { PasteInputProps, PasteTextInputInstance } from './types';
declare const _default: React.ForwardRefExoticComponent<PasteInputProps & React.RefAttributes<PasteTextInputInstance>>;
export default _default;
//# sourceMappingURL=PasteInput.d.ts.map