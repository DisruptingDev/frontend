'use client';

// React Imports
import { createContext, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'
import { FloatingTree } from '@floating-ui/react'

// Hook Imports
import useVerticalNav from '../../hooks/useVerticalNav'

// Util Imports
import { menuClasses } from '../../utils/menuClasses'

// Styled Component Imports
import StyledVerticalMenu from '../../styles/vertical/StyledVerticalMenu'

// Style Imports
import styles from '../../styles/styles.module.css'

// Default Config Imports
import { verticalSubMenuToggleDuration } from '../../defaultConfigs'

export const VerticalMenuContext = createContext({})

const Menu = (props, ref) => {
  // Props
  const {
    children,
    className,
    rootStyles,
    menuItemStyles,
    renderExpandIcon,
    renderExpandedMenuItemIcon,
    menuSectionStyles,
    browserScroll = false,
    triggerPopout = 'hover',
    popoutWhenCollapsed = false,
    subMenuOpenBehavior = 'accordion', // accordion, collapse
    transitionDuration = verticalSubMenuToggleDuration,
    collapsedMenuSectionLabel = '-',
    popoutMenuOffset = { mainAxis: 0 },
    textTruncate = true,
    ...rest
  } = props

  // States
  const [openSubmenu, setOpenSubmenu] = useState([])

  // Refs
  //const openSubmenusRef = useRef([])

  // Hooks
  const pathname = usePathname()
  //const { updateVerticalNavState } = useVerticalNav()
  const { isPopoutWhenCollapsed, updateVerticalNavState } = useVerticalNav();
  
  const toggleOpenSubmenu = useCallback(
    (...submenus) => {
      if (!submenus.length) return
      
      setOpenSubmenu(prevOpenSubmenu => {
        const openSubmenuCopy = [...prevOpenSubmenu];
      
        submenus.forEach(({ level, label, active = false, id }) => {
          const submenuIndex = openSubmenuCopy.findIndex(submenu => submenu.id === id);
          const submenuExists = submenuIndex >= 0;
          const isAccordion = subMenuOpenBehavior === 'accordion';

          if (isAccordion) {
              if (level === 0) {
                  openSubmenuCopy.forEach((submenu, index) => {
                      if (submenu.level === 0) {
                          openSubmenuCopy[index] = { ...submenu, active: submenu.id === id ? !submenu.active : false };
                      }
                  });
              } else {
                  if (submenuExists) {
                      openSubmenuCopy.splice(submenuIndex, 1);
                  } else {
                      openSubmenuCopy.push({ level, label, active, id });
                  }
              }
          } else {
              if (submenuExists) {
                  openSubmenuCopy.splice(submenuIndex, 1);
              } else {
                  openSubmenuCopy.push({ level, label, active, id });
              }
          }
      });

      return openSubmenuCopy;
  });
}, [subMenuOpenBehavior]);

useEffect(() => {
  const initialOpenSubmenus = parsePathnameForSubmenus(pathname);
  setOpenSubmenu(initialOpenSubmenus);
}, [pathname]);

useEffect(() => {
  updateVerticalNavState({ isPopoutWhenCollapsed });
}, [isPopoutWhenCollapsed, updateVerticalNavState]);

const providerValue = useMemo(() => ({
  browserScroll,
  triggerPopout,
  transitionDuration,
  menuItemStyles,
  menuSectionStyles,
  renderExpandIcon,
  renderExpandedMenuItemIcon,
  openSubmenu,
  toggleOpenSubmenu,
  subMenuOpenBehavior,
  collapsedMenuSectionLabel,
  popoutMenuOffset,
  textTruncate
}), [
  browserScroll,
  triggerPopout,
  transitionDuration,
  menuItemStyles,
  menuSectionStyles,
  renderExpandIcon,
  renderExpandedMenuItemIcon,
  openSubmenu,
  toggleOpenSubmenu,
  subMenuOpenBehavior,
  collapsedMenuSectionLabel,
  popoutMenuOffset,
  textTruncate
]);

  return (
    <VerticalMenuContext.Provider value={providerValue}>
      <FloatingTree>
        <StyledVerticalMenu
          ref={ref}
          className={classnames(menuClasses.root, className)}
          rootStyles={rootStyles}
          {...rest}
        >
          <ul className={styles.ul}>{children}</ul>
        </StyledVerticalMenu>
      </FloatingTree>
    </VerticalMenuContext.Provider>
  )
}

export default forwardRef(Menu)


// Placeholder for pathname parsing.  You MUST implement this according to your URL structure.
function parsePathnameForSubmenus(pathname) {
  // Example implementation (adapt to your needs)
  const parts = pathname.split('/').filter(part => part !== '');
  const submenus = [];
  if (parts.length > 1) {
    submenus.push({ level: 0, label: parts[1], active: true, id: parts[1] });
  }
  if (parts.length > 2) {
    submenus.push({ level: 1, label: parts[2], active: true, id: parts[2] });
  }

  return submenus;

  // Real implementation will likely involve query parameters, more complex logic:
  // const urlParams = new URLSearchParams(window.location.search);
  // const category = urlParams.get('category'); // Example using query params
  // ...
}