import { createPortal } from 'react-dom';

/**
 * Portal — renders children directly into document.body,
 * completely escaping any stacking context or z-index issues
 * caused by sticky/fixed parent elements.
 */
export default function Portal({ children }) {
  return createPortal(children, document.body);
}
