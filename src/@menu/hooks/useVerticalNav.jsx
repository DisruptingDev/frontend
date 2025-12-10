// React Imports
import { useContext } from 'react'
import { useState } from 'react';

// Context Imports
import VerticalNavContext from '../contexts/verticalNavContext'

const useVerticalNav = () => {
  // Hooks
  const [isPopoutWhenCollapsed, setIsPopoutWhenCollapsed] = useState(false);
  const context = useContext(VerticalNavContext)
  const updateVerticalNavState = (newState) => {
        setIsPopoutWhenCollapsed(newState.isPopoutWhenCollapsed);
      };
  return { isPopoutWhenCollapsed, updateVerticalNavState }
}    
 // if (context === undefined) {
    //TODO: set better error message
   // throw new Error('VerticalNav Component is required!')
 // }

  //return context


export default useVerticalNav
